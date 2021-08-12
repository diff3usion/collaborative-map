// import { 
//     BlockId as BID, 
//     BlockIdGroups,
// } from "./BlockId"
// import { BlockState, BlockStateKey, BlockStateValueRange, ofEnum } from "./BlockState"

export const a = 0

// const BIG = new BlockIdGroups()

// enum ColorId {
//     NONE                    = 0,
//     GRASS                   = 1,
//     SAND                    = 2,
//     WOOL                    = 3,
//     FIRE                    = 4,
//     ICE                     = 5,
//     METAL                   = 6,
//     PLANT                   = 7,
//     SNOW                    = 8,
//     CLAY                    = 9,
//     DIRT                    = 10,
//     STONE                   = 11,
//     WATER                   = 12,
//     WOOD                    = 13,
//     QUARTZ                  = 14,
//     COLOR_ORANGE            = 15,
//     COLOR_MAGENTA           = 16,
//     COLOR_LIGHT_BLUE        = 17,
//     COLOR_YELLOW            = 18,
//     COLOR_LIGHT_GREEN       = 19,
//     COLOR_PINK              = 20,
//     COLOR_GRAY              = 21,
//     COLOR_LIGHT_GRAY        = 22,
//     COLOR_CYAN              = 23,
//     COLOR_PURPLE            = 24,
//     COLOR_BLUE              = 25,
//     COLOR_BROWN             = 26,
//     COLOR_GREEN             = 27,
//     COLOR_RED               = 28,
//     COLOR_BLACK             = 29,
//     GOLD                    = 30,
//     DIAMOND                 = 31,
//     LAPIS                   = 32,
//     EMERALD                 = 33,
//     PODZOL                  = 34,
//     NETHER                  = 35,
//     TERRACOTTA_WHITE        = 36,
//     TERRACOTTA_ORANGE       = 37,
//     TERRACOTTA_MAGENTA      = 38,
//     TERRACOTTA_LIGHT_BLUE   = 39,
//     TERRACOTTA_YELLOW       = 40,
//     TERRACOTTA_LIGHT_GREEN  = 41,
//     TERRACOTTA_PINK         = 42,
//     TERRACOTTA_GRAY         = 43,
//     TERRACOTTA_LIGHT_GRAY   = 44,
//     TERRACOTTA_CYAN         = 45,
//     TERRACOTTA_PURPLE       = 46,
//     TERRACOTTA_BLUE         = 47,
//     TERRACOTTA_BROWN        = 48,
//     TERRACOTTA_GREEN        = 49,
//     TERRACOTTA_RED          = 50,
//     TERRACOTTA_BLACK        = 51,
//     CRIMSON_NYLIUM          = 52,
//     CRIMSON_STEM            = 53,
//     CRIMSON_HYPHAE          = 54,
//     WARPED_NYLIUM           = 55,
//     WARPED_STEM             = 56,
//     WARPED_HYPHAE           = 57,
//     WARPED_WART_BLOCK       = 58,
//     DEEPSLATE               = 59,
//     RAW_IRON                = 60,
//     GLOW_LICHEN             = 61,
// }

// type Color = [number, number, number, number]    // RGBA
// const ColorValue: Map<number, Color> = new Map([
//     [ColorId.NONE,                      [  0,   0,   0, 255]],
//     [ColorId.GRASS,                     [127, 178,  56, 255]],
//     [ColorId.SAND,                      [247, 233, 163, 255]],
//     [ColorId.WOOL,                      [199, 199, 199, 255]],
//     [ColorId.FIRE,                      [255,   0,   0, 255]],
//     [ColorId.ICE,                       [160, 160, 255, 255]],
//     [ColorId.METAL,                     [167, 167, 167, 255]],
//     [ColorId.PLANT,                     [  0, 124,   0, 255]],
//     [ColorId.SNOW,                      [255, 255, 255, 255]],
//     [ColorId.CLAY,                      [164, 168, 184, 255]],
//     [ColorId.DIRT,                      [151, 109,  77, 255]],
//     [ColorId.STONE,                     [112, 112, 112, 255]],
//     [ColorId.WATER,                     [ 64,  64, 255, 255]],
//     [ColorId.WOOD,                      [143, 119,  72, 255]],
//     [ColorId.QUARTZ,                    [255, 252, 245, 255]],
//     [ColorId.COLOR_ORANGE,              [216, 127,  51, 255]],
//     [ColorId.COLOR_MAGENTA,             [178,  76, 216, 255]],
//     [ColorId.COLOR_LIGHT_BLUE,          [102, 153, 216, 255]],
//     [ColorId.COLOR_YELLOW,              [229, 229,  51, 255]],
//     [ColorId.COLOR_LIGHT_GREEN,         [127, 204,  25, 255]],
//     [ColorId.COLOR_PINK,                [242, 127, 165, 255]],
//     [ColorId.COLOR_GRAY,                [ 76,  76,  76, 255]],
//     [ColorId.COLOR_LIGHT_GRAY,          [153, 153, 153, 255]],
//     [ColorId.COLOR_CYAN,                [ 76, 127, 153, 255]],
//     [ColorId.COLOR_PURPLE,              [127,  63, 178, 255]],
//     [ColorId.COLOR_BLUE,                [ 51,  76, 178, 255]],
//     [ColorId.COLOR_BROWN,               [102,  76,  51, 255]],
//     [ColorId.COLOR_GREEN,               [102, 127,  51, 255]],
//     [ColorId.COLOR_RED,                 [153,  51,  51, 255]],
//     [ColorId.COLOR_BLACK,               [ 25,  25,  25, 255]],
//     [ColorId.GOLD,                      [250, 238,  77, 255]],
//     [ColorId.DIAMOND,                   [ 92, 219, 213, 255]],
//     [ColorId.LAPIS,                     [ 74, 128, 255, 255]],
//     [ColorId.EMERALD,                   [  0, 217,  58, 255]],
//     [ColorId.PODZOL,                    [129,  86,  49, 255]],
//     [ColorId.NETHER,                    [112,   2,   0, 255]],
//     [ColorId.TERRACOTTA_WHITE,          [209, 177, 161, 255]],
//     [ColorId.TERRACOTTA_ORANGE,         [159,  82,  36, 255]],
//     [ColorId.TERRACOTTA_MAGENTA,        [149,  87, 108, 255]],
//     [ColorId.TERRACOTTA_LIGHT_BLUE,     [112, 108, 138, 255]],
//     [ColorId.TERRACOTTA_YELLOW,         [186, 133,  36, 255]],
//     [ColorId.TERRACOTTA_LIGHT_GREEN,    [103, 117,  53, 255]],
//     [ColorId.TERRACOTTA_PINK,           [160,  77,  78, 255]],
//     [ColorId.TERRACOTTA_GRAY,           [ 57,  41,  35, 255]],
//     [ColorId.TERRACOTTA_LIGHT_GRAY,     [135, 107,  98, 255]],
//     [ColorId.TERRACOTTA_CYAN,           [ 87,  92,  92, 255]],
//     [ColorId.TERRACOTTA_PURPLE,         [122,  73,  88, 255]],
//     [ColorId.TERRACOTTA_BLUE,           [ 76,  62,  92, 255]],
//     [ColorId.TERRACOTTA_BROWN,          [ 76,  50,  35, 255]],
//     [ColorId.TERRACOTTA_GREEN,          [ 76,  82,  42, 255]],
//     [ColorId.TERRACOTTA_RED,            [142,  60,  46, 255]],
//     [ColorId.TERRACOTTA_BLACK,          [ 37,  22,  16, 255]],
//     [ColorId.CRIMSON_NYLIUM,            [189,  48,  49, 255]],
//     [ColorId.CRIMSON_STEM,              [148,  63,  97, 255]],
//     [ColorId.CRIMSON_HYPHAE,            [ 92,  25,  29, 255]],
//     [ColorId.WARPED_NYLIUM,             [ 22, 126, 134, 255]],
//     [ColorId.WARPED_STEM,               [ 58, 142, 140, 255]],
//     [ColorId.WARPED_HYPHAE,             [ 86,  44,  62, 255]],
//     [ColorId.WARPED_WART_BLOCK,         [ 20, 180, 133, 255]],
//     [ColorId.DEEPSLATE,                 [100, 100, 100, 255]],
//     [ColorId.RAW_IRON,                  [216, 175, 147, 255]],
//     [ColorId.GLOW_LICHEN,               [127, 167, 150, 255]]
// ]) 

// type BlockStateArgRanges = {[key in BlockStateKey]?: BlockStateValueRange}
// type BlockStateFilteredArgRanges = {
//     filter: (id: BID) => boolean,
//     args: BlockStateArgRanges
// }
// interface BlockStateRule {
//     id          : BID
//     args?       : BlockStateArgRanges
// }


// const stateOfId: (id: BID, args?: BlockStateArgRanges) => BlockStateRule 
// = (id, args) => ({ namespace: "minecraft", id, args })
// const toRule: (id: BID) => BlockStateRule
// = id => stateOfId(id)
// const toRuleWithArgRanges: (...argRules: BlockStateFilteredArgRanges[]) => (id: BID) => BlockStateRule
// = (...argRules) => id => stateOfId(id, argRules.find(r =>r.filter(id))?.args)
// const NoneColorBlocks = [
//     ...BIG.Airs,
//     ...BIG.SpecialRails,
//     ...BIG.Torchs,
//     ...BIG.Buttons,
//     ...BIG.GlassPanes,
//     ...BIG.MobHeads,
//     ...BIG.Pots,
//     BID.barrier,
//     BID.redstone_lamp,
//     BID.cake,
//     BID.candle_cake,
//     BID.redstone_wire,
//     BID.ladder,
//     BID.rail,
//     BID.lever,
//     BID.repeater,
//     BID.tripwire,
//     BID.tripwire_hook,
//     BID.comparator,
//     BID.end_rod,
//     BID.glass,
//     BID.nether_portal,
//     BID.structure_void,
//     BID.iron_bars,
//     BID.chain,
//     BID.light,
// ]

// const exclude: (...subStrs: string[]) => (id: BID) => boolean
// = (...subStrs) => id => subStrs.reduce<boolean>((cumu, s) => cumu && id === s, true)

// const GrassColorBlocks = [
//     BID.grass_block,
//     BID.slime_block,
// ].map(toRule)
// const SandColorBlocks = [
//     ...BIG.AllBirchs.filter(exclude(BID.birch_button)),
//     ...BIG.AllSandstones,
//     ...BIG.AllEndBricks,
//     BID.sand,
//     BID.glowstone,
//     BID.end_stone,
//     BID.bone_block,
//     BID.turtle_egg,
//     BID.scaffolding,
//     BID.candle,
// ].map(toRuleWithArgRanges({
//     filter: id => id === BID.birch_log, 
//     args: { axis : ofEnum(["y"]) }
// }))
// const WoolColorBlocks = [
//     ...BIG.Beds,
//     BID.cobweb,
//     BID.mushroom_stem,
//     BID.white_candle,
// ].map(toRuleWithArgRanges({
//     filter: id => BIG.Beds.indexOf(id) !== -1, 
//     args: { axis : ofEnum(["head"]) }
// }))
// const FireColorBlocks = [
//     BID.lava,
//     BID.tnt,
//     BID.fire,
//     BID.redstone_block,
// ].map(toRule)
// const IceColorBlocks = [
//     ...BIG.Ices,
// ].map(toRule)
// const MetalColorBlocks = [
//     ...BIG.Anvils,
//     ...BIG.Lanterns,
//     BID.iron_block,
//     BID.iron_door,
//     BID.brewing_stand,
//     BID.heavy_weighted_pressure_plate,
//     BID.iron_trapdoor,
//     BID.lantern,
//     BID.grindstone,
//     BID.lodestone,
// ].map(toRule)
// const PlantColorBlocks = [
//     ...BIG.Saplings,
//     ...BIG.Flowers,
//     ...BIG.Stems,
//     ...BIG.AttachedStems,
//     ...BIG.Leaves,
//     BID.wheat,
//     BID.sugar_cane,
//     BID.lily_pad,
//     BID.cocoa,
//     BID.carrots,
//     BID.potatoes,
//     BID.beetroots,
//     BID.sweet_berry_bush,
//     BID.grass,
//     BID.tall_grass,
//     BID.fern,
//     BID.large_fern,
//     BID.vine,
//     BID.cactus,
//     BID.bamboo,
//     BID.glow_lichen,
//     BID.cave_vines,
//     BID.cave_vines_plant,
//     BID.spore_blossom,
//     BID.flowering_azalea,
//     BID.big_dripleaf,
//     BID.big_dripleaf_stem,
//     BID.small_dripleaf,
// ].map(toRule)
// const SnowColorBlocks = [
//     ...BIG.WhiteBlocks.filter(exclude(BID.white_candle)),
//     BID.snow,
//     BID.snow_block,
//     BID.powder_snow,
// ].map(toRule)
// const ClayColorBlocks = [
//     ...BIG.InfestedBlocks.filter(exclude(BID.infested_deepslate)),
//     BID.clay,
// ].map(toRule)
// const DirtColorBlocks = [
//     ...BIG.AllGranites,
//     ...BIG.AllJungles.filter(exclude(BID.jungle_button)),
//     BID.dirt,
//     BID.coarse_dirt,
//     BID.farmland,
//     BID.dirt_path,
//     BID.jukebox,
//     BID.brown_mushroom_block,
//     BID.rooted_dirt,
//     BID.hanging_roots,
// ].map(toRuleWithArgRanges({
//     filter: id => id === BID.jungle_log, 
//     args: { axis : ofEnum(["y"]) }
// }))
// const StoneColorBlocks = [
//     ...BIG.AllStones.filter(exclude(BID.stone_button)),
//     ...BIG.AllCobbleStones,
//     ...BIG.AllStoneBricks,
//     ...BIG.AllAndesites,
//     ...BIG.Ores,
//     ...BIG.Furnaces,
//     ...BIG.Pistons,
//     ...BIG.Cauldrons,
//     BID.bedrock,
//     BID.dispenser,
//     BID.spawner,
//     BID.ender_chest,
//     BID.dropper,
//     BID.observer,
//     BID.stonecutter,
//     BID.piston_head,
//     BID.gravel,
//     BID.acacia_log,
//     BID.hopper,
// ].map(toRuleWithArgRanges({
//     filter: id => id === BID.acacia_log, 
//     args: { axis : ofEnum(["x", "z"]) }
// }))
// const WaterColorBlocks = [
//     BID.kelp,
//     BID.kelp_plant,
//     BID.seagrass,
//     BID.tall_seagrass,
//     BID.water,
//     BID.bubble_column,
// ].map(toRule)
// const WoodColorBlocks = [
//     ...BIG.AllOaks.filter(exclude(BID.oak_button)),
//     ...BIG.Banners,
//     BID.note_block,
//     BID.bookshelf,
//     BID.chest,
//     BID.crafting_table,
//     BID.trapped_chest,
//     BID.daylight_detector,
//     BID.loom,
//     BID.barrel,
//     BID.cartography_table,
//     BID.fletching_table,
//     BID.lectern,
//     BID.smithing_table,
//     BID.composter,
//     BID.bamboo_sapling,
//     BID.dead_bush,
//     BID.petrified_oak_slab,
//     BID.beehive,
// ].map(toRuleWithArgRanges({
//     filter: id => id === BID.oak_log, 
//     args: { axis : ofEnum(["y"]) }
// }))
// const QuartzColorBlocks = [
//     ...BIG.AllDiorites,
//     ...BIG.AllQuartzs,
//     BID.birch_log,
//     BID.sea_lantern,
//     BID.target,
// ].map(toRuleWithArgRanges({
//     filter: id => id === BID.birch_log, 
//     args: { axis : ofEnum(["x", "z"]) }
// }))
// const OrangeColorBlocks = [
//     ...BIG.AllAcacias.filter(exclude(BID.acacia_button)),
//     ...BIG.AllRedSandstones,
//     ...BIG.OrangeBlocks,
//     ...BIG.AllNormalCoppers,
//     BID.red_sand,
//     BID.pumpkin,
//     BID.carved_pumpkin,
//     BID.jack_o_lantern,
//     BID.terracotta,
//     BID.honey_block,
//     BID.honeycomb_block,
//     BID.lightning_rod,
//     BID.raw_copper_block,
// ].map(toRuleWithArgRanges({
//     filter: id => id === BID.acacia_log, 
//     args: { axis : ofEnum(["y"]) }
// }))
// const MagentaColorBlocks = [
//     ...BIG.MagentaBlocks,
//     ...BIG.AllPurpurs,
// ].map(toRule)
// const LightBlueColorBlocks = [
//     ...BIG.LightBlueBlocks,
//     BID.soul_fire,
// ].map(toRule)
// const YellowColorBlocks = [
//     ...BIG.YellowBlocks,
//     BID.sponge,
//     BID.wet_sponge,
//     BID.hay_block,
//     BID.bee_nest,
// ].map(toRule)

// export const stateToColor: (bs: BlockState) => Color
// = bs => {
    
//     return [0, 0, 0, 0]
// }
