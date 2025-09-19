
import {memo} from "react"
import Thumbnail from "../../authoring/components/Thumbnail";
import {Handle} from '@xyflow/react';
import SimpleFloatingEdge from "./SimpleFloatingEdge";
import { Badge } from "@material-ui/core";

const NodeBase = ({data}) => (
    <div className={`bg-black w-40 text-center ${data.visited ? "" : "brightness-60"}`}>
        <div>
            <Thumbnail components={data.components}/>
            <span className=" w-[100%] text-white">{data.label}</span>
        </div>
        <Handle type="target" position="top" id="t" isConnectable={false} className="opacity-0"/>
        <Handle type="target" position="bottom" id="b" isConnectable={false} className="opacity-0"/>
        <Handle type="target" position="left" id="l" isConnectable={false} className="opacity-0"/>
        <Handle type="target" position="right" id="r" isConnectable={false} className="opacity-0"/>
        <Handle type="source" position="top" id="t" isConnectable={false} className="opacity-0"/>
        <Handle type="source" position="bottom" id="b" isConnectable={false} className="opacity-0"/>
        <Handle type="source" position="left" id="l" isConnectable={false} className="opacity-0"/>
        <Handle type="source" position="right" id="r" isConnectable={false} className="opacity-0"/>
    </div>
)

const ThumbnailNode = memo((({data}) => (
    <>  
        {data.visitCounter !== undefined ? (
            <Badge badgeContent={data.visitCounter} color="primary" overlap="rectangular">
                <NodeBase data={data}/>
            </Badge>
        ):(
            <NodeBase data={data}/>
        )}
    </>
)))

ThumbnailNode.displayName = "ThumbnailNode";

export const nodeTypes = {
    thumbnail: ThumbnailNode
}

export const edgeTypes = {
    simpleFloating: SimpleFloatingEdge
}