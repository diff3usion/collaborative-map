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

fn stringify(encoded: &[u8]) -> String {
    unsafe { std::str::from_utf8_unchecked(&encoded).to_owned() }
}

#[wasm_bindgen]
#[allow(non_snake_case)]
pub fn getLocationMeta(region: u16, x: usize, z: usize) -> Option<String> {
    match MAP_REGION_ID_STORE.lock().unwrap().get(region) {
        Some(region) => match region.get_location(x, z) {
            Some(location) => Some(stringify(&location.encode())),
            None => None,
        },
        None => None,
    }
}

#[wasm_bindgen]
#[allow(non_snake_case)]
pub fn getBlockMeta(region: u16, x: usize, z: usize, i: usize) -> Option<String> {
    match MAP_REGION_ID_STORE.lock().unwrap().get(region) {
        Some(region) => match region.get_location(x, z) {
            Some(location) => match region.get_blocks(location) {
                Some(blocks) => {
                    if blocks.len() > i {
                        Some(stringify(&blocks[i].encode()))
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
