/**
 *  Map data format with variable block numbers
 *
 *  RegionData      xLength * zLength * (8 + size * 5) Bytes
 *  LocationEntry       8 Bytes
 *      size        2 Bytes         // at most 65536 blocks
 *      offset      4 Bytes         // at most 4 GB size
 *      biomeId     2 Bytes         // at most 65536 biomes
 *  BlockEntry          5 Bytes
 *      state_key   2 Bytes         // at most 65536 states
 *      height      2 Bytes         // at most 65536 y-position
 *      light       1 Byte
 *          block_light 4 bits      // 0 - 15
 *          sky_light   4 bits      // 0 - 15
 *      
 *  Voxel map scenario: region is 256 * 256 and locations 4 blocks
 *      data    256 * 256 * (8 + 4 * 5) = 1.75 MB
 */
use once_cell::sync::Lazy;
use std::cmp::Ordering::*;
use std::collections::HashMap;
use std::hash::{Hash, Hasher};
use std::sync::Mutex;

#[derive(Debug, Eq, PartialEq, Hash, Clone)]
pub struct NamespacedId {
    pub namespace: String,
    pub id: String,
}

#[derive(Debug, Clone)]
pub struct BlockState {
    pub block: NamespacedId,
    pub args: HashMap<String, String>,
}

impl BlockState {
    pub fn stringify(&self) -> String {
        let mut args_vec: Vec<(&String, &String)> = self.args.iter().collect();
        args_vec.sort_by(|(k0, v0), (k1, v1)| match k0.cmp(v0) {
            Less => Less,
            Greater => Greater,
            Equal => k1.cmp(v1),
        });
        let a: Vec<String> = args_vec
            .iter()
            .map(|(k, v)| format!("{}={}", k, v))
            .collect();
        format!(
            "{}:{}[{}]",
            self.block.id,
            self.block.namespace,
            a.join(",")
        )
    }
}

impl Eq for BlockState {}
impl PartialEq for BlockState {
    fn eq(&self, other: &BlockState) -> bool {
        self.stringify() == other.stringify()
    }
}
impl Hash for BlockState {
    fn hash<H: Hasher>(&self, state: &mut H) {
        self.block.hash(state);
        let mut args_vec: Vec<(&String, &String)> = self.args.iter().collect();
        args_vec.sort_by(|(k0, v0), (k1, v1)| match k0.cmp(v0) {
            Less => Less,
            Greater => Greater,
            Equal => k1.cmp(v1),
        });
        let a: Vec<String> = args_vec
            .iter()
            .map(|(k, v)| format!("{}{}", k, v))
            .collect();
        a.join("").hash(state);
    }
}

#[derive(Debug)]
pub struct BlockEntry {
    pub state_key: u16,
    pub height: u16,
    pub light: u8,
}

impl BlockEntry {
    pub fn encode(&self) -> [u8; 5] {
        let mut res = [0; 5];
        res[0] = self.state_key as u8;
        res[1] = (self.state_key >> 8) as u8;
        res[2] = self.height as u8;
        res[3] = (self.height >> 8) as u8;
        res[4] = self.light;
        res
    }
}

#[derive(Debug)]
pub struct LocationEntry {
    pub size: u16,
    pub offset: u32,
    pub biome_id: u16,
}

impl LocationEntry {
    pub fn encode(&self) -> [u8; 4] {
        let mut res = [0; 4];
        res[0] = self.size as u8;
        res[1] = (self.size >> 8) as u8;
        res[2] = self.biome_id as u8;
        res[3] = (self.biome_id >> 8) as u8;
        res
    }
}

impl Default for LocationEntry {
    fn default() -> LocationEntry {
        LocationEntry {
            size: 0,
            offset: 0,
            biome_id: 0,
        }
    }
}

#[derive(Debug)]
pub struct MapRegion {
    pub id: u16,
    pub position: (i32, i32),
    pub size: (usize, usize),
    pub location_entries: Vec<LocationEntry>,
    pub block_entries: Vec<BlockEntry>,
    pub modify_time: u64,
}

impl MapRegion {
    pub fn get_location(&self, x: usize, z: usize) -> Option<&LocationEntry> {
        if x >= self.size.0 || z >= self.size.1 {
            return None;
        }
        Some(&self.location_entries[x * self.size.0 + z])
    }

    pub fn get_blocks(&self, location: &LocationEntry) -> Option<&[BlockEntry]> {
        Some(
            &self.block_entries
                [(location.offset as usize)..(location.offset as usize + location.size as usize)],
        )
    }
}

pub struct BlockStateKeyStore {
    pub key_count: u16,
    pub key_map: HashMap<u16, BlockState>,
    pub value_map: HashMap<BlockState, u16>,
}

impl BlockStateKeyStore {
    fn init_key(&mut self, bs: &BlockState) -> u16 {
        let res = self.key_count;
        self.key_map.insert(res, bs.clone());
        self.value_map.insert(bs.clone(), res);
        self.key_count += 1;
        res
    }
    pub fn get_or_init(&mut self, bs: &BlockState) -> u16 {
        let recorded_key = self.value_map.get(&bs);
        match recorded_key {
            Some(id) => *id,
            None => self.init_key(bs),
        }
    }
    #[allow(dead_code)]
    pub fn get(&self, key: u16) -> Option<&BlockState> {
        self.key_map.get(&key)
    }
    #[allow(dead_code)]
    pub fn get_key(&self, bs: &BlockState) -> Option<u16> {
        match self.value_map.get(&bs) {
            Some(id) => Some(*id),
            None => None,
        }
    }
}

pub struct MapRegionIdStore {
    pub id_count: u16,
    pub id_map: HashMap<u16, MapRegion>,
}

impl MapRegionIdStore {
    pub fn add(&mut self, mr: MapRegion) -> u16 {
        let mut region = mr;
        let res = self.id_count;
        region.id = res;
        self.id_map.insert(region.id, region);
        res
    }
    #[allow(dead_code)]
    pub fn get(&self, id: u16) -> Option<&MapRegion> {
        self.id_map.get(&id)
    }
}

pub static BLOCK_STATE_KEY_STORE: Lazy<Mutex<BlockStateKeyStore>> = Lazy::new(|| {
    Mutex::new(BlockStateKeyStore {
        key_count: 0,
        key_map: HashMap::new(),
        value_map: HashMap::new(),
    })
});

pub static MAP_REGION_ID_STORE: Lazy<Mutex<MapRegionIdStore>> = Lazy::new(|| {
    Mutex::new(MapRegionIdStore {
        id_count: 0,
        id_map: HashMap::new(),
    })
});
