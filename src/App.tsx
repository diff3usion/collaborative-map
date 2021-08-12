import { ChangeEvent, useEffect } from 'react'
import { Subject } from 'rxjs'
import * as PIXI from "pixi.js";
import Layout from 'antd/lib/layout/layout'

import { HeadBar } from './view/HeadBar'
import { MainPanel } from './view/MainPanel'
import { SidePanel } from './view/SidePanel'
import './App.css'
import config from './config.json'

import("./action")

const openTexturePackFile = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target!.files![0])
        TexturePackZipFile$.next(event.target!.files![0])
}

const openVoxelRegionFile = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target!.files)
        VoxelRegionZipFiles$.next(event.target!.files)
}

const App = () => {
    useEffect(() => {
        document.title = config.Title
    }, [])
    return (
        <div className="app">
            <Layout>
                <HeadBar />
                <MainPanel/ >
                <SidePanel/ >
                <input type='file' multiple={true} accept='application/zip' onChange={openVoxelRegionFile} />
                <input type='file' accept='application/zip' onChange={openTexturePackFile} />
            </Layout>
        </div>
    )
}

export const TexturePackZipFile$ = new Subject<File>()
export const VoxelRegionZipFiles$ = new Subject<FileList>()

import("./model/map")

export default App
