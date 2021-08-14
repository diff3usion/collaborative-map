extern crate console_error_panic_hook;
extern crate web_sys;

use once_cell::sync::Lazy;
use regex::Regex;
use std::collections::HashMap;
use std::io::prelude::*;
use std::io::Cursor;
use std::panic;

use super::super::data::*;

const VOXEL_MAP_COLOMN_BYTES: usize = 18;
const VOXEL_MAP_REGION_WIDTH: usize = 256;
const VOXEL_MAP_REGION_HEIGHT: usize = 256;

#[derive(Debug)]
struct VoxelMapCache {
    control: HashMap<String, String>,
    key: HashMap<u16, BlockState>,
    data: Vec<u8>,
}

fn read_key_block_state_args(args: &str) -> HashMap<String, String> {
    args.split(",")
        .map(|s| s.split_at(s.find("=").unwrap()))
        .map(|(key, val)| (String::from(key), String::from(&val[1..])))
        .collect()
}

fn read_key_block_state(text: &str) -> BlockState {
    pub static RE: Lazy<Regex> = Lazy::new(|| {
        Regex::new(r"Block\{(?P<namespace>\w+):(?P<id>\w+)\}(\[(?P<args>.+)\])*").unwrap()
    });
    let cap = RE.captures(text).unwrap();
    BlockState {
        block: NamespacedId {
            namespace: String::from(
                cap.name("namespace")
                    .map(|namespace| namespace.as_str())
                    .unwrap(),
            ),
            id: String::from(cap.name("id").map(|id| id.as_str()).unwrap()),
        },
        args: match cap.name("args").map(|id| id.as_str()) {
            Some(args) => read_key_block_state_args(args),
            None => HashMap::new(),
        },
    }
}

fn read_key_file(file: &mut zip::read::ZipFile) -> HashMap<u16, BlockState> {
    let mut buf = String::new();
    file.read_to_string(&mut buf).unwrap();
    buf.lines()
        .map(|s| s.split_at(s.find(" ").unwrap()))
        .map(|(key, val)| (key.parse::<u16>().unwrap(), read_key_block_state(&val[1..])))
        .collect()
}

fn read_data_file(file: &mut zip::read::ZipFile) -> Vec<u8> {
    let mut buf = Vec::new();
    file.read_to_end(&mut buf).unwrap();
    buf.to_owned()
}

fn read_control_file(file: &mut zip::read::ZipFile) -> HashMap<String, String> {
    let mut buf = String::new();
    file.read_to_string(&mut buf).unwrap();
    buf.lines()
        .map(|s| s.split_at(s.find(":").unwrap()))
        .map(|(key, val)| (String::from(key), String::from(&val[1..])))
        .collect()
}

fn read_voxel_cache_archive(array: &[u8]) -> Result<VoxelMapCache, &str> {
    let reader = Cursor::new(array);
    let mut archive = zip::ZipArchive::new(reader).unwrap();
    let mut control: Result<HashMap<String, String>, &str> = Err("");
    let mut key: Result<HashMap<u16, BlockState>, &str> = Err("");
    let mut data: Result<Vec<u8>, &str> = Err("");
    for i in 0..archive.len() {
        let mut file = archive.by_index(i).unwrap();
        match file.name() {
            "control" => control = Ok(read_control_file(&mut file)),
            "key" => key = Ok(read_key_file(&mut file)),
            "data" => data = Ok(read_data_file(&mut file)),
            _ => {}
        };
    }
    control.and_then(|control| {
        key.and_then(|key| data.map(|data| VoxelMapCache { control, key, data }))
    })
}

fn decode_voxel_map_cache(
    cache: &VoxelMapCache,
) -> Result<(Vec<LocationEntry>, Vec<BlockEntry>), String> {
    panic::set_hook(Box::new(console_error_panic_hook::hook));
    let mut remapped_key: Vec<u16> = vec![0; cache.key.len() + 1];
    for (k, v) in cache.key.iter() {
        remapped_key[*k as usize] = BLOCK_STATE_KEY_STORE.lock().unwrap().get_or_init(v);
    }

    fn data_index_version_1(x: usize, z: usize, byte: usize) -> usize {
        byte + x * VOXEL_MAP_COLOMN_BYTES + z * VOXEL_MAP_COLOMN_BYTES * VOXEL_MAP_REGION_WIDTH
    }
    fn data_index_version_2(x: usize, z: usize, byte: usize) -> usize {
        x + z * VOXEL_MAP_REGION_WIDTH + byte * VOXEL_MAP_REGION_WIDTH * VOXEL_MAP_REGION_HEIGHT
    }
    fn decode_layer(
        data: &impl Fn(usize) -> u8,
        offset: usize,
        remapped_key: &Vec<u16>,
    ) -> BlockEntry {
        BlockEntry {
            height: data(offset) as u16,
            state_key: remapped_key
                [((data(offset + 1) as usize) << 8) + (data(offset + 2) as usize)],
            light: data(offset + 3),
        }
    }
    fn decode_column(
        blocks: &mut Vec<BlockEntry>,
        data: &impl Fn(usize) -> u8,
        remapped_key: &Vec<u16>,
    ) -> LocationEntry {
        let res = LocationEntry {
            size: 4,
            offset: blocks.len() as u32,
            biome_id: ((data(16) as u16) << 8) + data(17) as u16,
        };
        let new_blocks = vec![
            decode_layer(&data, 4, &remapped_key),
            decode_layer(&data, 0, &remapped_key),
            decode_layer(&data, 8, &remapped_key),
            decode_layer(&data, 12, &remapped_key),
        ];
        for b in new_blocks {
            blocks.push(b);
        }
        res
    }
    if cache.data.len() != VOXEL_MAP_REGION_WIDTH * VOXEL_MAP_REGION_HEIGHT * VOXEL_MAP_COLOMN_BYTES
    {
        return Err("Error when decoding region data: Unmatched size".to_owned());
    }

    let version = cache.control.get("version");
    let data_index: fn(usize, usize, usize) -> usize = match version.map(String::as_str) {
        Some("1") => data_index_version_1,
        Some("2") => data_index_version_2,
        _ => {
            return Err("Error when decoding region data: Unknown version".to_owned());
        }
    };
    let mut decoded_locations: Vec<LocationEntry> = Vec::new();
    let mut decoded_blocks: Vec<BlockEntry> = Vec::new();
    for x in 0..VOXEL_MAP_REGION_WIDTH {
        for z in 0..VOXEL_MAP_REGION_HEIGHT {
            let data_at = Box::new(|b| cache.data[data_index(x, z, b)]);
            let entry = decode_column(&mut decoded_blocks, &data_at, &remapped_key);
            decoded_locations.push(entry);
        }
    }
    Ok((decoded_locations, decoded_blocks))
}

fn position_from_filename(filename: &str) -> (i32, i32) {
    let name = filename.split_at(filename.find(".").unwrap()).0;
    let position_str = name.split_at(filename.find(",").unwrap());
    (
        position_str.0.parse().unwrap(),
        position_str.1[1..].parse().unwrap(),
    )
}

pub fn load_voxel_map_cache_file(
    filename: &str,
    modify_time: u64,
    array: &[u8],
) -> Result<u16, String> {
    match read_voxel_cache_archive(array) {
        Ok(cache) => match decode_voxel_map_cache(&cache) {
            Ok((location_entries, block_entries)) => {
                Ok(MAP_REGION_ID_STORE.lock().unwrap().add(MapRegion {
                    id: 0,
                    location_entries,
                    block_entries,
                    position: position_from_filename(filename),
                    size: (VOXEL_MAP_REGION_WIDTH, VOXEL_MAP_REGION_HEIGHT),
                    modify_time,
                }))
            }
            Err(msg) => Err(format!("Error when decoding cache: {}", msg)),
        },
        Err(msg) => Err(format!("Error when reading cache archive file: {}", msg)),
    }
}
