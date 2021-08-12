// MC 1.17

import { BlockId as BID } from "./BlockId"


// export interface BlockState extends GeneralBlockState {
//     namespace   : "minecraft"
//     id          : BID
//     args?       : {[key in BlockStateKey]?: string}
// }


// export enum BlockStateKey {
//     age = 'age',
//     attached = 'attached',
//     attachment = 'attachment',
//     axis = 'axis',
//     bites = 'bites',
//     bottom = 'bottom',
//     charges = 'charges',
//     conditional = 'conditional',
//     delay = 'delay',
//     disarmed = 'disarmed',
//     distance = 'distance',
//     down = 'down',
//     drag = 'drag',
//     east = 'east',
//     eggs = 'eggs',
//     enabled = 'enabled',
//     extended = 'extended',
//     eye = 'eye',
//     face = 'face',
//     facing = 'facing',
//     half = 'half',
//     hanging = 'hanging',
//     has_book = 'has_book',
//     has_bottle_0 = 'has_bottle_0',
//     has_bottle_1 = 'has_bottle_1',
//     has_bottle_2 = 'has_bottle_2',
//     has_record = 'has_record',
//     hatch = 'hatch',
//     hinge = 'hinge',
//     in_wall = 'in_wall',
//     instrument = 'instrument',
//     inverted = 'inverted',
//     layers = 'layers',
//     leaves = 'leaves',
//     level = 'level',
//     lit = 'lit',
//     locked = 'locked',
//     mode = 'mode',
//     moisture = 'moisture',
//     north = 'north',
//     note = 'note',
//     occupied = 'occupied',
//     open = 'open',
//     orientation = 'orientation',
//     part = 'part',
//     persistent = 'persistent',
//     pickles = 'pickles',
//     power = 'power',
//     powered = 'powered',
//     rotation = 'rotation',
//     shape = 'shape',
//     short = 'short',
//     signal_fire = 'signal_fire',
//     snowy = 'snowy',
//     south = 'south',
//     stage = 'stage',
//     triggered = 'triggered',
//     type = 'type',
//     unstable = 'unstable',
//     up = 'up',
//     waterlogged = 'waterlogged',
//     west = 'west',
// }

// enum BlockStateValueType {
//     BOOLEAN,
//     INTEGER,
//     ENUM,
// }

// export type BlockStateValueRange = {
//     type        : BlockStateValueType,
//     intRange?   : [number, number],
//     enumString? : string[],
// }

// export const ofBoolean: BlockStateValueRange = { type: BlockStateValueType.BOOLEAN }
// export const ofInteger: (min: number, max: number) => BlockStateValueRange
// = (min, max) => ({ 
//     type: BlockStateValueType.INTEGER, 
//     intRange: [min, max] 
// })
// export const ofEnum: (values: string[]) => BlockStateValueRange
// = enumString => ({ 
//     type: BlockStateValueType.ENUM, 
//     enumString
// })


// const AttachmentRange = [
//     "ceiling",
//     "double_wall",
//     "floor",
//     "single_wall"
// ]

// const AxisRangeXYZ = [
//     "x",
//     "y",
//     "z"
// ]

// const AxisRangeXZ = [
//     "x",
//     "z"
// ]

// const RangeRedstoneWire = [
//     'none',
//     'side',
//     'up'
// ]

// const FaceRange = [
//     "ceiling",
//     "floor",
//     "wall"
// ]

// const FacingRange6 = [
//     "down",
//     "east",
//     "north",
//     "south",
//     "west",
//     "up"
// ]

// const FacingRange4 = [
//     "east",
//     "north",
//     "south",
//     "west"
// ]

// const FacingRange5 = [
//     "down",
//     "east",
//     "north",
//     "south",
//     "west"
// ]

// const HalfRangeLU = [
//     "lower",
//     "upper"
// ]

// const HalfRangeBT = [
//     "bottom",
//     "top"
// ]

// const HingeRange = [
//     "left",
//     "right"
// ]

// const InstrumentRange = [
//     'banjo',
//     'basedrum',
//     'bass',
//     'bell',
//     'bit',
//     'chime',
//     'cow_bell',
//     'digeridoo',
//     'flute',
//     'guitar',
//     'harp',
//     'hat',
//     'iron_xylophone',
//     'snare',
//     'xylophone'
// ]

// const LeavesRange = [
//     'large',
//     'none',
//     'small'
// ]

// const ModeRangeComparator = [
//     'compare',
//     'subtract'
// ]

// const ModeRangeStructure = [
//     'corner',
//     'data',
//     'load',
//     'save'
// ]

// const PartRange = [
//     'foot',
//     'head'
// ]

// const OrientationRange = [
//     'down_east',
//     'down_north',
//     'down_south',
//     'down_west',
//     'east_up',
//     'north_up',
//     'south_up',
//     'up_east',
//     'up_north',
//     'up_south',
//     'up_west',
//     'west_up'
// ]

// const ShapeRangeSpecialRail = [
//     'ascending_east',
//     'ascending_north',
//     'ascending_south',
//     'ascending_west',
//     'east_west',
//     'north_south'
// ]

// const ShapeRangeStairs = [
//     'inner_left',
//     'inner_right',
//     'outer_left',
//     'outer_right',
//     'straight'
// ]

// const ShapeRangeRail = [
//     'ascending_east',
//     'ascending_north',
//     'ascending_south',
//     'ascending_west',
//     'east_west',
//     'north_south',
//     'north_east',
//     'north_west',
//     'south_east',
//     'south_west'
// ]

// const TypeRangePiston = [
//     'normal',
//     'sticky'
// ]

// const TypeRangeChest = [
//     'left',
//     'right',
//     'single'
// ]

// const TypeRangeSlab = [
//     'bottom',
//     'double', 
//     'top'
// ]

// const BlockStateOrientationRangePairs: () => [BlockStateValueRange, BID[]][]
// = () =>
//     [
//         [ofBoolean, [
//             ...BIG.Fences,
//             ...BIG.GlassPanes,
//             ...BIG.Walls,
//             ...BIG.Fires,
//             ...BIG.MushroomBlocks,
//             BID.chorus_plant,
//             BID.iron_bars,
//             BID.mushroom_stem,
//             BID.tripwire,
//             BID.vine,
//         ]],
//         [ofEnum(RangeRedstoneWire), [BID.redstone_wire]]
//     ]


// const BlockStateRangePairs: [BlockStateKey, [BlockStateValueRange, BID[]][]][] 
// = [
//     [BlockStateKey.age, [
//         [ofInteger(0, 1), [BID.bamboo]],
//         [ofInteger(0, 2), [BID.cocoa]],
//         [ofInteger(0, 3), [
//             BID.nether_wart,
//             BID.beetroots,
//             BID.frosted_ice,
//             BID.sweet_berry_bush,
//         ]],
//         [ofInteger(0, 5), [BID.chorus_flower]],
//         [ofInteger(0, 6), [
//             BID.wheat,
//             BID.pumpkin_stem,
//             BID.melon_stem,
//             BID.carrots,
//             BID.potatoes,
//         ]],
//         [ofInteger(0, 7), [
//             ...BIG.Fires,
//             BID.cactus,
//             BID.sugar_cane,
//         ]],
//         [ofInteger(0, 25), [BID.kelp]],
//     ]],
//     [BlockStateKey.attached, [
//         [ofBoolean, [
//             BID.tripwire,
//             BID.tripwire_hook,
//         ]]
//     ]],
//     [BlockStateKey.attachment, [
//         [ofEnum(AttachmentRange), [BID.bell]]
//     ]],
//     [BlockStateKey.axis, [
//         [ofEnum(AxisRangeXYZ), [
//             ...BIG.Logs,
//             ...BIG.Stems,
//             BID.basalt,
//             BID.bone_block,
//             BID.chain,
//             BID.hay_block,
//             BID.purpur_pillar,
//             BID.quartz_pillar,
//             BID.deepslate,
//         ]],
//         [ofEnum(AxisRangeXZ), [BID.nether_portal]]
//     ]],
//     [BlockStateKey.bites, [
//         [ofInteger(0, 6), [BID.cake]]
//     ]],
//     [BlockStateKey.charges, [
//         [ofInteger(0, 4), [BID.respawn_anchor]]
//     ]],
//     [BlockStateKey.conditional, [
//         [ofBoolean, BIG.CommandBlocks]
//     ]],
//     [BlockStateKey.delay, [
//         [ofInteger(1, 4), [BID.repeater]]
//     ]],
//     [BlockStateKey.disarmed, [
//         [ofBoolean, [BID.tripwire]]
//     ]],
//     [BlockStateKey.distance, [
//         [ofInteger(0, 7), [BID.scaffolding]],
//         [ofInteger(1, 7), BIG.Leaves],
//     ]],
//     [BlockStateKey.down, [
//         [ofBoolean, [
//             ...BIG.MushroomBlocks,
//             BID.chorus_plant,
//             BID.mushroom_stem,
//         ]]
//     ]],
//     [BlockStateKey.drag, [
//         [ofBoolean, [BID.bubble_column]]
//     ]],
//     [BlockStateKey.east, BlockStateOrientationRangePairs()],
//     [BlockStateKey.eggs, [
//         [ofInteger(1, 4), [BID.turtle_egg]]
//     ]],
//     [BlockStateKey.enabled, [
//         [ofBoolean, [BID.hopper]]
//     ]],
//     [BlockStateKey.extended, [
//         [ofBoolean, BIG.Pistons]
//     ]],
//     [BlockStateKey.eye, [
//         [ofBoolean, [BID.end_portal_frame]]
//     ]],
//     [BlockStateKey.face, [
//         [ofEnum(FaceRange), [
//             ...BIG.Buttons,
//             BID.grindstone,
//             BID.lever,
//         ]]
//     ]],
//     [BlockStateKey.facing, [
//         [ofEnum(FacingRange6), [
//             ...BIG.CommandBlocks,
//             ...BIG.ShulkerBoxs,
//             BID.barrel,
//             BID.dispenser,
//             BID.dropper,
//             BID.end_rod,
//             BID.observer,
//             BID.moving_piston,
//             BID.piston_head,
//             ...BIG.Pistons
//         ]],
//         [ofEnum(FacingRange4), [
//             ...BIG.Anvils,
//             ...BIG.Banners,
//             ...BIG.Beds,
//             ...BIG.CoralWallFans,
//             ...BIG.Buttons,
//             ...BIG.Doors,
//             ...BIG.FenceGates,
//             ...BIG.GlazedTerracottas,
//             ...BIG.MobHeads,
//             ...BIG.Signs,
//             ...BIG.Stairs,
//             ...BIG.Trapdoors,
//             ...BIG.AttachedStems,
//             ...BIG.Furnaces,
//             ...BIG.Campfires,
//             ...BIG.WallTorchs,
//             BID.bell,
//             BID.beehive,
//             BID.carved_pumpkin,
//             BID.chest,
//             BID.cocoa,
//             BID.end_portal_frame,
//             BID.ender_chest,
//             BID.grindstone,
//             BID.jack_o_lantern,
//             BID.ladder,
//             BID.lectern,
//             BID.lever,
//             BID.loom,
//             BID.comparator,
//             BID.repeater,
//             BID.stonecutter,
//             BID.trapped_chest,
//             BID.tripwire_hook,
//         ]],
//         [ofEnum(FacingRange5), [BID.hopper]]
//     ]],
//     [BlockStateKey.half, [
//         [ofEnum(HalfRangeLU), [
//             ...BIG.Doors,
//             BID.tall_seagrass,
//             BID.sunflower,
//             BID.lilac,
//             BID.rose_bush,
//             BID.peony,
//             BID.tall_grass,
//             BID.large_fern,
//         ]],
//         [ofEnum(HalfRangeBT), [
//             ...BIG.Stairs,
//             ...BIG.Trapdoors,
//         ]]
//     ]],
//     [BlockStateKey.hanging, [
//         [ofBoolean, BIG.Lanterns]
//     ]],
//     [BlockStateKey.has_book, [
//         [ofBoolean, [BID.lectern]]
//     ]],
//     [BlockStateKey.has_bottle_0, [
//         [ofBoolean, [BID.brewing_stand]]
//     ]],
//     [BlockStateKey.has_bottle_1, [
//         [ofBoolean, [BID.brewing_stand]]
//     ]],
//     [BlockStateKey.has_bottle_2, [
//         [ofBoolean, [BID.brewing_stand]]
//     ]],
//     [BlockStateKey.has_record, [
//         [ofBoolean, [BID.jukebox]]
//     ]],
//     [BlockStateKey.hatch, [
//         [ofInteger(0, 2), [BID.turtle_egg]]
//     ]],
//     [BlockStateKey.hinge, [
//         [ofEnum(HingeRange), BIG.Doors]
//     ]],
//     [BlockStateKey.in_wall, [
//         [ofBoolean, BIG.FenceGates]
//     ]],
//     [BlockStateKey.instrument, [
//         [ofEnum(InstrumentRange), [BID.note_block]]
//     ]],
//     [BlockStateKey.inverted, [
//         [ofBoolean, [BID.daylight_detector]]
//     ]],
//     [BlockStateKey.layers, [
//         [ofInteger(1, 8), [BID.snow]]
//     ]],
//     [BlockStateKey.leaves, [
//         [ofEnum(LeavesRange), [BID.bamboo]]
//     ]],
//     [BlockStateKey.level, [
//         [ofInteger(0, 3), BIG.Cauldrons],
//         [ofInteger(0, 8), [BID.composter]],
//         [ofInteger(0, 15), [
//             BID.water,
//             BID.lava,
//         ]],
//     ]],
//     [BlockStateKey.lit, [
//         [ofBoolean, [
//             ...BIG.Campfires,
//             ...BIG.Furnaces,
//             BID.redstone_ore,
//             BID.redstone_torch,
//             BID.redstone_wall_torch,
//             BID.redstone_lamp,
//         ]]
//     ]],
//     [BlockStateKey.locked, [
//         [ofBoolean, [BID.repeater]]
//     ]],
//     [BlockStateKey.mode, [
//         [ofEnum(ModeRangeComparator), [BID.comparator]],
//         [ofEnum(ModeRangeStructure), [BID.structure_block]],
//     ]],
//     [BlockStateKey.moisture, [
//         [ofInteger(0, 7), [BID.farmland]]
//     ]],
//     [BlockStateKey.north, BlockStateOrientationRangePairs()],
//     [BlockStateKey.note, [
//         [ofInteger(0, 24), [BID.note_block]]
//     ]],
//     [BlockStateKey.occupied, [
//         [ofBoolean, BIG.Beds]
//     ]],
//     [BlockStateKey.open, [
//         [ofBoolean, [
//             ...BIG.Doors,
//             ...BIG.FenceGates,
//             ...BIG.Trapdoors,
//             BID.barrel,
//         ]]
//     ]],
//     [BlockStateKey.orientation, [
//         [ofEnum(OrientationRange), [BID.jigsaw]]
//     ]],
//     [BlockStateKey.part, [
//         [ofEnum(PartRange), BIG.Beds]
//     ]],
//     [BlockStateKey.persistent, [
//         [ofBoolean, BIG.Leaves]
//     ]],
//     [BlockStateKey.pickles, [
//         [ofInteger(1, 4), [BID.sea_pickle]]
//     ]],
//     [BlockStateKey.power, [
//         [ofInteger(0, 15), [
//             ...BIG.WeightedPressurePlates,
//             BID.redstone_wire,
//             BID.daylight_detector,
//         ]]
//     ]],
//     [BlockStateKey.powered, [
//         [ofBoolean, [
//             ...BIG.Buttons,
//             ...BIG.Doors,
//             ...BIG.FenceGates,
//             ...BIG.WoodPressurePlates,
//             ...BIG.Trapdoors,
//             ...BIG.SpecialRails,
//             BID.lectern,
//             BID.lever,
//             BID.note_block,
//             BID.observer,
//             BID.comparator,
//             BID.repeater,
//             BID.tripwire,
//             BID.tripwire_hook
//         ]]
//     ]],
//     [BlockStateKey.rotation, [
//         [ofInteger(0, 15), [
//             ...BIG.Banners,
//             ...BIG.MobHeads,
//             ...BIG.Signs,
//         ]]
//     ]],
//     [BlockStateKey.shape, [
//         [ofEnum(ShapeRangeSpecialRail), BIG.SpecialRails],
//         [ofEnum(ShapeRangeStairs), BIG.Stairs],
//         [ofEnum(ShapeRangeRail), [BID.rail]]
//     ]],
//     [BlockStateKey.short, [
//         [ofBoolean, [BID.piston_head]]
//     ]],
//     [BlockStateKey.signal_fire, [
//         [ofBoolean, BIG.Campfires]
//     ]],
//     [BlockStateKey.snowy, [
//         [ofBoolean, [
//             BID.grass_block,
//             BID.podzol,
//             BID.mycelium,
//         ]]
//     ]],
//     [BlockStateKey.south, BlockStateOrientationRangePairs()],
//     [BlockStateKey.stage, [
//         [ofInteger(0, 1), [
//             ...BIG.Saplings,
//             BID.bamboo
//         ]]
//     ]],
//     [BlockStateKey.triggered, [
//         [ofBoolean, [
//             BID.dispenser,
//             BID.dropper
//         ]]
//     ]],
//     [BlockStateKey.type, [
//         [ofEnum(TypeRangePiston), [
//             BID.piston_head,
//             BID.moving_piston,
//         ]],
//         [ofEnum(TypeRangeChest), [
//             BID.chest,
//             BID.trapped_chest,
//         ]],
//         [ofEnum(TypeRangeSlab), BIG.Slabs]
//     ]],
//     [BlockStateKey.unstable, [
//         [ofBoolean, [BID.tnt]]
//     ]],
//     [BlockStateKey.up, [
//         [ofBoolean, [
//             ...BIG.Walls,
//             ...BIG.MushroomBlocks,
//             ...BIG.Fires,
//             BID.chorus_plant,
//             BID.mushroom_stem,
//             BID.vine,
//         ]]
//     ]],
//     [BlockStateKey.waterlogged, [
//         [ofBoolean, [
//             ...BIG.CoralFans,
//             ...BIG.CoralWallFans,
//             ...BIG.Fences,
//             ...BIG.GlassPanes,
//             ...BIG.Signs,
//             ...BIG.WallSigns,
//             ...BIG.Slabs,
//             ...BIG.Stairs,
//             ...BIG.Trapdoors,
//             ...BIG.Walls,
//             ...BIG.Campfires,
//             ...BIG.Lanterns,
//             BID.chain,
//             BID.chest,
//             BID.conduit,
//             BID.ender_chest,
//             BID.iron_bars,
//             BID.ladder,
//             BID.scaffolding,
//             BID.sea_pickle,
//             BID.trapped_chest,
//         ]]
//     ]],
//     [BlockStateKey.west, BlockStateOrientationRangePairs()],
// ]
