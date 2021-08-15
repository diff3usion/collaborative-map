use super::super::data::*;
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::sync::Mutex;

type Color = [u8; 4];
type ColorTableEntry = (String, [u8; 4], HashSet<String>);

#[derive(Serialize, Deserialize, Debug)]
struct ColorTable {
    table: Vec<ColorTableEntry>,
}

static LIGHTER_MULTIPLIER: f32 = 1.0;
static NORMAL_MULTIPLIER: f32 = 0.86;
static DARKER_MULTIPLIER: f32 = 0.71;

static COLOR_TABLE: Lazy<Mutex<ColorTable>> =
    Lazy::new(|| Mutex::new(ColorTable { table: Vec::new() }));

pub fn load_color_table(json: &str) {
    let deserialized: ColorTable = serde_json::from_str(&json).unwrap();
    COLOR_TABLE.lock().unwrap().table = deserialized.table;
}

pub fn render_map_region(region: &MapRegion) -> Vec<u8> {
    let table = &COLOR_TABLE.lock().unwrap().table;
    let state_to_color = |bs: &BlockState| -> Color {
        let index = table
            .iter()
            .position(|(_, _, set)| set.contains(&bs.block.id));
        match index {
            Some(i) => table[i].1,
            None => {
                log!("Unknown color index for: {}", &bs.block.id);
                [0; 4]
            }
        }
    };
    let (x_len, z_len) = region.size;
    let mut res: Vec<u8> = vec![0; x_len * z_len * 4];
    let key_store = &BLOCK_STATE_KEY_STORE.lock().unwrap();
    let mut northern_block_height: u16 = 0;
    for x in 0..x_len {
        for z in 0..z_len {
            let location = region.get_location(x, z).unwrap();
            let blocks = region.get_blocks(location).unwrap();
            let index = blocks
                .iter()
                .rposition(|b| state_to_color(key_store.get(b.state_key).unwrap()) != [0; 4]);
            if !index.is_none() {
                let target = &blocks[index.unwrap()];
                let color = state_to_color(key_store.get(target.state_key).unwrap());
                let multiplier = if z == 0 || target.height == northern_block_height {
                    NORMAL_MULTIPLIER
                } else if target.height > northern_block_height {
                    LIGHTER_MULTIPLIER
                } else {
                    DARKER_MULTIPLIER
                };
                northern_block_height = target.height;
                for i in 0..4 {
                    let color = if i == 3 {
                        color[i]
                    } else {
                        (color[i] as f32 * multiplier).floor() as u8
                    };
                    res[z * z_len * 4 + x * 4 + i] = color;
                }
            }
        }
    }
    res
}
