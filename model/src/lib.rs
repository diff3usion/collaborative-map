mod utils;
extern crate web_sys;

use data::*;
use wasm_bindgen::prelude::*;

// A macro to provide `println!(..)`-style syntax for `console.log` logging.
#[macro_export]
macro_rules! log {
    ( $( $t:tt )* ) => {
        web_sys::console::log_1(&format!( $( $t )* ).into());
    }
}

pub mod data;
pub mod loader;
pub mod renderer;

#[wasm_bindgen]
#[allow(non_snake_case)]
pub fn loadVoxelMapCacheFile(filename: &str, modify_time: u64, array: &[u8]) -> u16 {
    loader::voxel_map_loader::load_voxel_map_cache_file(filename, modify_time, array).unwrap()
}

#[wasm_bindgen]
#[allow(non_snake_case)]
pub fn renderLoadedRegion(id: u16) -> Vec<u8> {
    renderer::mc_map_renderer::render_map_region(
        MAP_REGION_ID_STORE.lock().unwrap().get(id).unwrap(),
    )
}

#[wasm_bindgen]
#[allow(non_snake_case)]
pub fn loadMcMapColorTable(json: &str) {
    renderer::mc_map_renderer::load_color_table(json);
}

#[wasm_bindgen]
#[allow(non_snake_case)]
pub fn getRegionRect(region: u16) -> Option<Vec<i32>> {
    match MAP_REGION_ID_STORE.lock().unwrap().get(region) {
        Some(region) => Some(vec![
            region.position.0,
            region.position.1,
            region.size.0 as i32,
            region.size.1 as i32,
        ]),
        None => None,
    }
}

#[wasm_bindgen]
#[allow(non_snake_case)]
pub fn getRegionTime(region: u16) -> Option<u64> {
    match MAP_REGION_ID_STORE.lock().unwrap().get(region) {
        Some(region) => Some(region.modify_time),
        None => None,
    }
}

#[wasm_bindgen]
#[allow(non_snake_case)]
pub fn getLocationData(region: u16, x: usize, z: usize) -> Option<Vec<u8>> {
    match MAP_REGION_ID_STORE.lock().unwrap().get(region) {
        Some(region) => match region.get_location(x, z) {
            Some(location) => Some(location.encode()),
            None => None,
        },
        None => None,
    }
}

#[wasm_bindgen]
#[allow(non_snake_case)]
pub fn getBlockData(region: u16, x: usize, z: usize, i: usize) -> Option<Vec<u8>> {
    match MAP_REGION_ID_STORE.lock().unwrap().get(region) {
        Some(region) => match region.get_location(x, z) {
            Some(location) => match region.get_blocks(location) {
                Some(blocks) => {
                    if blocks.len() > i {
                        Some(blocks[i].encode())
                    } else {
                        None
                    }
                }
                None => None,
            },
            None => None,
        },
        None => None,
    }
}

#[wasm_bindgen]
#[allow(non_snake_case)]
pub fn getBlockState(key: u16) -> Option<String> {
    match BLOCK_STATE_KEY_STORE.lock().unwrap().get(key) {
        Some(bs) => Some(bs.stringify()),
        None => None,
    }
}

use utils::*;
#[wasm_bindgen]
#[allow(non_snake_case)]
pub fn regionsOfRect(x: i32, y: i32, w: usize, h: usize) -> Vec<u16> {
    let mut res: Vec<u16> = Vec::new();
    for (id, region) in MAP_REGION_ID_STORE.lock().unwrap().iter() {
        if does_two_rects_overlap((region.position, region.size), ((x, y), (w, h))) {
            res.push(*id)
        }
    }
    res
}
