import { PaintBucket, Pencil } from "lucide-react";
import ChromePicker from "../wrapper/ChromePicker";
import NumberInput from "../wrapper/NumberInput";
import useEditorStore from "../stores/editor";
import { useEffect, useState } from "react";
import { getComponent } from "../scene/scene";
import { modifyComponentProp } from "../scene/operations/component";

interface ShapeProps {
    fill: string;
    stroke: string;
    strokeWidth: number;
}

function extractProps(selected: string): ShapeProps {
    const { fill, stroke, strokeWidth } = getComponent(selected);
    return { fill, stroke, strokeWidth };
}

function ShapeSection() {
    const selected = useEditorStore(state => state.selected)!;

    const [props, setProps] = useState(extractProps(selected));

    useEffect(() => {
        setProps(extractProps(selected));
    }, [selected]);


    function modifyProps(prop: string, value: string | number) {
        modifyComponentProp(selected!, `${prop}`, value);
        setProps({ ...props, [prop]: value });
    }

    return (
        <>
            <ChromePicker value={props.fill} onChange={(value) => modifyProps("fill", value)}>
                <PaintBucket size={13} />
            </ChromePicker>
            <ChromePicker value={props.stroke} onChange={(value) => modifyProps("stroke", value)}>
                <Pencil size={13} />
            </ChromePicker>
            <NumberInput value={Number(props.strokeWidth)} onChange={(value) => modifyProps("strokeWidth", value)} />
        </>
    )
}

export default ShapeSection;
