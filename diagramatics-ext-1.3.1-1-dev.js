/**
 *  Class for 2D Vectors
*/
class Vector2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    add(v) {
        return new Vector2(this.x + v.x, this.y + v.y);
    }
    sub(v) {
        return new Vector2(this.x - v.x, this.y - v.y);
    }
    scale(s) {
        return new Vector2(this.x * s, this.y * s);
    }
    mul(v) {
        return new Vector2(this.x * v.x, this.y * v.y);
    }
    rotate(angle) {
        let x = this.x * Math.cos(angle) - this.y * Math.sin(angle);
        let y = this.x * Math.sin(angle) + this.y * Math.cos(angle);
        return new Vector2(x, y);
    }
    dot(v) {
        return this.x * v.x + this.y * v.y;
    }
    cross(v) {
        return this.x * v.y - this.y * v.x;
    }
    equals(v) {
        return this.x == v.x && this.y == v.y;
    }
    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    length_sq() {
        return this.x * this.x + this.y * this.y;
    }
    angle() {
        return Math.atan2(this.y, this.x);
    }
    normalize() {
        let len = this.length();
        return new Vector2(this.x / len, this.y / len);
    }
    copy() {
        return new Vector2(this.x, this.y);
    }
    apply(f) {
        return f(this.copy());
    }
}
/**
 * Helper function to create a Vector2
 */
function V2$5(x, y) {
    return new Vector2(x, y);
}
/**
 * Helper function to create a Vector2 from an angle
 * @param angle angle in radians
 * @returns Vector2 with length 1
 */
function Vdir(angle) {
    return new Vector2(Math.cos(angle), Math.sin(angle));
}
class Transform {
    static translate(v) {
        return (p) => p.add(v);
    }
    static rotate(angle, pivot) {
        return (p) => p.sub(pivot).rotate(angle).add(pivot);
    }
    static scale(scale, origin) {
        return (p) => p.sub(origin).mul(scale).add(origin);
    }
    static reflect_over_point(q) {
        return (p) => p.sub(q).rotate(Math.PI).add(q);
    }
    static reflect_over_line(p1, p2) {
        let v = p2.sub(p1);
        let n = v.rotate(Math.PI / 2).normalize();
        return (p) => {
            let d = n.dot(p.sub(p1));
            return p.sub(n.scale(2 * d));
        };
    }
    static skewX(angle, ybase) {
        return (p) => {
            let x = p.x + (ybase - p.y) * Math.tan(angle);
            return new Vector2(x, p.y);
        };
    }
    static skewY(angle, xbase) {
        return (p) => {
            let y = p.y + (xbase - p.x) * Math.tan(angle);
            return new Vector2(p.x, y);
        };
    }
}

// BBCode parser for multiline text object
//
var BB_TokenType;
(function (BB_TokenType) {
    BB_TokenType["TEXT"] = "TEXT";
    BB_TokenType["OPEN_TAG"] = "OPEN_TAG";
    BB_TokenType["CLOSE_TAG"] = "CLOSE_TAG";
    BB_TokenType["EOF"] = "EOF";
})(BB_TokenType || (BB_TokenType = {}));
class BB_Lexer {
    static parse_tag_content(str) {
        if (str[0] === "/") {
            // close tag
            let name = str.substring(1);
            return {
                type: BB_TokenType.CLOSE_TAG,
                attributes: { _tag_name: name }
            };
        }
        // open tag
        let space_id = str.indexOf(" ");
        let equal_id = str.indexOf("=");
        if (space_id === -1 && equal_id === -1) {
            // [name]
            return {
                type: BB_TokenType.OPEN_TAG,
                attributes: { _tag_name: str }
            };
        }
        if (space_id === -1 && equal_id > 0) {
            // [name=value]
            let name = str.substring(0, equal_id);
            let value = str.substring(equal_id + 1);
            let attributes = { _tag_name: name };
            attributes[name] = value;
            return {
                type: BB_TokenType.OPEN_TAG,
                attributes
            };
        }
        // [name attr1=value1 attr2=value2]
        throw new Error("Unimplemented");
    }
    static parse(text) {
        let tokens = [];
        let pos = 0;
        let len = text.length;
        while (pos < len) {
            // Find the next tag
            // Find [
            let TagLeft = text.indexOf("[", pos);
            if (TagLeft === -1) {
                // no more tags, add the rest of the text
                tokens.push({
                    type: BB_TokenType.TEXT,
                    attributes: { _text: text.substring(pos) }
                });
                break;
            }
            if (TagLeft > pos) {
                // add the text before the [
                tokens.push({
                    type: BB_TokenType.TEXT,
                    attributes: { _text: text.substring(pos, TagLeft) }
                });
            }
            // find ]
            let TagRight = text.indexOf("]", TagLeft);
            let nextTagLeft = text.indexOf("[", TagLeft + 1);
            // make sure there is no [ between the [ and ]
            if (nextTagLeft > 0 && nextTagLeft < TagRight)
                return null;
            // make sure there is a ] after the [
            if (TagRight === -1)
                return null;
            let tag_content = text.substring(TagLeft + 1, TagRight);
            tokens.push(BB_Lexer.parse_tag_content(tag_content));
            pos = TagRight + 1;
        }
        return tokens;
    }
}
class BB_multiline {
    static from_BBCode(text, linespace = "1em") {
        let tspans = [];
        let tag_stack = [];
        let tokens = BB_Lexer.parse(text);
        if (tokens === null) {
            console.error("Invalid BBCode");
            return;
        }
        for (let token of tokens) {
            switch (token.type) {
                case BB_TokenType.OPEN_TAG:
                    {
                        // if the token is [br] then add a new line
                        if (token.attributes['_tag_name'] === "br") {
                            tspans.push({ text: "\n", style: { dy: linespace } });
                            break;
                        }
                        tag_stack.push(token.attributes);
                    }
                    break;
                case BB_TokenType.CLOSE_TAG:
                    {
                        if (tag_stack.length === 0) {
                            console.error("Invalid BBCode");
                            return;
                        }
                        let tag_top = tag_stack[tag_stack.length - 1];
                        if (tag_top['_tag_name'] !== token.attributes['_tag_name']) {
                            console.error("Invalid BBCode");
                            return;
                        }
                        tag_stack.pop();
                    }
                    break;
                case BB_TokenType.TEXT:
                    {
                        let style = BB_multiline.build_style(tag_stack);
                        tspans.push({ text: token.attributes['_text'], style });
                    }
                    break;
            }
        }
        return tspans;
    }
    static build_style(tag_stack) {
        let style = {};
        for (let tag of tag_stack) {
            switch (tag['_tag_name']) {
                case "b":
                    style["font-weight"] = "bold";
                    break;
                case "i":
                    style["font-style"] = "italic";
                    break;
                case "color":
                    style["fill"] = tag["color"];
                    break;
                case "size":
                    style["font-size"] = tag["size"];
                    break;
                case "dx":
                    style["dx"] = tag["dx"];
                    break;
                case "dy":
                    style["dy"] = tag["dy"];
                    break;
                case "font":
                    style["font-family"] = tag["font"];
                    break;
                case "var":
                    style["textvar"] = true;
                    break;
                case "tag":
                    style["tag"] = tag["tag"];
                    break;
            }
        }
        return style;
    }
}

/*
* For objects that contain children, having a tag is useful so that the children can be easily accessed.
*/
var TAG;
(function (TAG) {
    TAG["LINE"] = "line";
    TAG["CIRCLE"] = "circle";
    TAG["TEXTVAR"] = "textvar";
    // prefix
    TAG["ROW_"] = "row_";
    TAG["COL_"] = "col_";
    // arrow
    TAG["ARROW_LINE"] = "arrow_line";
    TAG["ARROW_HEAD"] = "arrow_head";
    // table
    TAG["TABLE"] = "table";
    TAG["CONTAIN_TABLE"] = "contain_table";
    TAG["TABLE_CELL"] = "table_cell";
    TAG["TABLE_CONTENT"] = "table_content";
    //graph
    TAG["GRAPH_AXIS"] = "graph_axis_line";
    TAG["GRAPH_TICK"] = "graph_tick";
    TAG["GRAPH_TICK_LABEL"] = "graph_tick_label";
    TAG["GRAPH_GRID"] = "graph_grid";
})(TAG || (TAG = {}));

function assert(condition, message) {
    if (!condition) {
        throw new Error(message || "Assertion failed");
    }
}
var DiagramType;
(function (DiagramType) {
    DiagramType["Polygon"] = "polygon";
    DiagramType["Curve"] = "curve";
    DiagramType["Text"] = "text";
    DiagramType["Image"] = "image";
    DiagramType["Diagram"] = "diagram";
    DiagramType["MultilineText"] = "multilinetext";
})(DiagramType || (DiagramType = {}));
const DEFAULT_FONTSIZE = "16"; // 16px (12pt) is the web default
function anchor_to_textdata(anchor) {
    // TODO : might want to look at
    // hanging vs text-before-edge
    // ideographic vs text-after-edge
    switch (anchor) {
        case "top-left": return { "text-anchor": "start", "dy": "0.75em" };
        case "top-center": return { "text-anchor": "middle", "dy": "0.75em" };
        case "top-right": return { "text-anchor": "end", "dy": "0.75em" };
        case "center-left": return { "text-anchor": "start", "dy": "0.25em" };
        case "center-center": return { "text-anchor": "middle", "dy": "0.25em" };
        case "center-right": return { "text-anchor": "end", "dy": "0.25em" };
        case "bottom-left": return { "text-anchor": "start", "dy": "-0.25em" };
        case "bottom-center": return { "text-anchor": "middle", "dy": "-0.25em" };
        case "bottom-right": return { "text-anchor": "end", "dy": "-0.25em" };
        default: throw new Error("Unknown anchor " + anchor);
    }
}
/**
* Diagram Class
*
* Diagram is a tree structure
* Diagram can be a polygon, curve, text, image, or diagram
* Polygon is a closed path
* Curve is an open path
* Diagram is a tree of Diagrams
*/
class Diagram {
    constructor(type_, args = {}) {
        this.children = [];
        this.path = undefined; // Polygon and Curve have a path
        this.origin = new Vector2(0, 0); // position of the origin of the diagram
        this.style = {};
        this.textdata = {};
        this.multilinedata = {};
        this.imgdata = {};
        this.mutable = false;
        this.tags = [];
        this.type = type_;
        this.path = args.path;
        if (args.children) {
            this.children = args.children;
        }
        if (args.textdata) {
            this.textdata = args.textdata;
        }
        if (args.imgdata) {
            this.imgdata = args.imgdata;
        }
        if (args.tags) {
            this.tags = args.tags;
        }
        if (args.multilinedata) {
            this.multilinedata = args.multilinedata;
        }
    }
    /**
     * Turn the diagram into a mutable diagram
     */
    mut() {
        this.mutable = true;
        // make path mutable
        if (this.path != undefined)
            this.path.mutable = true;
        // make all of the children mutable
        for (let i = 0; i < this.children.length; i++)
            this.children[i].mut();
        return this;
    }
    mut_parent_only() {
        this.mutable = true;
        // make path mutable
        if (this.path != undefined)
            this.path.mutable = true;
        return this;
    }
    /**
     * Create a copy of the diagram that is immutable
     */
    immut() {
        let newd = this.copy();
        newd.mutable = false;
        // make path immutable
        if (this.path != undefined)
            this.path.mutable = false;
        // make all of the children immutable
        for (let i = 0; i < newd.children.length; i++)
            newd.children[i].immut();
        return newd;
    }
    static deep_setPrototypeOf(obj) {
        Object.setPrototypeOf(obj, Diagram.prototype);
        let objd = obj;
        // convert position and origin_offset to Vector2
        objd.origin = Object.setPrototypeOf(objd.origin, Vector2.prototype);
        // make sure all of the children are Diagram
        for (let c = 0; c < objd.children.length; c++)
            Diagram.deep_setPrototypeOf(objd.children[c]);
        // set path to Path
        if (objd.path != undefined) {
            Object.setPrototypeOf(objd.path, Path.prototype);
            objd.path = objd.path.copy();
        }
    }
    /**
     * Copy the diagram
     */
    copy() {
        // do deepcopy with JSON
        let newd = JSON.parse(JSON.stringify(this));
        // turn newd into Diagram
        Diagram.deep_setPrototypeOf(newd);
        return newd;
    }
    copy_if_not_mutable() {
        return this.mutable ? this : this.copy();
    }
    /**
     * Append tags to the diagram
     */
    append_tags(tags) {
        let newd = this.copy_if_not_mutable();
        if (!Array.isArray(tags))
            tags = [tags];
        for (let tag of tags) {
            if (!newd.tags.includes(tag))
                newd.tags.push(tag);
        }
        return newd;
    }
    /**
     * Remove tags from the diagram
     */
    remove_tags(tags) {
        let newd = this.copy_if_not_mutable();
        newd.tags = newd.tags.filter(t => !tags.includes(t));
        return newd;
    }
    /**
     * Reset all tags of the diagram
     */
    reset_tags() {
        let newd = this.copy_if_not_mutable();
        newd.tags = [];
        return newd;
    }
    /**
    * Check if the diagram contains a tag
    */
    contain_tag(tag) {
        return this.tags.includes(tag);
    }
    contain_all_tags(tags) {
        for (let tag of tags) {
            if (!this.tags.includes(tag))
                return false;
        }
        return true;
    }
    /**
     * Collect all children and subchildren of the diagram
     * helper function for flatten()
     */
    collect_children() {
        let children = [];
        if (this.type == DiagramType.Diagram) {
            for (let c of this.children) {
                children = children.concat(c.collect_children());
            }
        }
        else {
            children.push(this);
        }
        return children;
    }
    /**
     * Flatten the children structure of the diagram
     * so that the diagram only has one level of children
     * \* implemented for performance reason
     */
    flatten() {
        let newd = this.copy_if_not_mutable();
        newd.children = newd.collect_children();
        return newd;
    }
    /**
     * Apply a function to the diagram
     * @param func function to apply
     * func takes in a diagram and returns a diagram
     */
    apply(func) {
        return func(this.copy_if_not_mutable());
    }
    /**
     * Apply a function to the diagram and all of its children recursively
     * @param func function to apply
     * func takes in a diagram and returns a diagram
     */
    apply_recursive(func) {
        let newd = this.copy_if_not_mutable();
        // apply to self
        newd = func(newd);
        // apply to children
        for (let i = 0; i < newd.children.length; i++) {
            newd.children[i] = newd.children[i].apply_recursive(func);
        }
        return newd;
    }
    /**
    * Apply a function to the diagram and all of its children recursively
    * The function is only applied to the diagrams that contain a specific tag
    * @param tags the tag to filter the diagrams
    * @param func function to apply
    * func takes in a diagram and returns a diagram
    */
    apply_to_tagged_recursive(tags, func) {
        if (!Array.isArray(tags))
            tags = [tags];
        let newd = this.copy_if_not_mutable();
        // if the diagram has the tag, apply the function to self
        if (newd.contain_all_tags(tags))
            newd = func(newd);
        // apply to children
        for (let i = 0; i < newd.children.length; i++) {
            newd.children[i] = newd.children[i].apply_to_tagged_recursive(tags, func);
        }
        return newd;
    }
    /**
     * Combine another diagram with this diagram
     * @param diagrams a diagram or a list of diagrams
     */
    combine(...diagrams) {
        return diagram_combine(this, ...diagrams);
    }
    /**
     * Convert the diagram to a curve
     * If the diagram is a polygon, convert it to a curve
     * If the diagram is a Diagram, convert all of the children to curves
     */
    to_curve() {
        let newd = this.copy_if_not_mutable();
        if (newd.type == DiagramType.Polygon) {
            newd.type = DiagramType.Curve;
        }
        else if (newd.type == DiagramType.Diagram) {
            // newd.children = newd.children.map(c => c.to_curve());
            for (let i = 0; i < newd.children.length; i++)
                newd.children[i] = newd.children[i].to_curve();
        }
        return newd;
    }
    /**
     * Convert the diagram to a polygon
     * If the diagram is a curve, convert it to a polygon
     * If the diagram is a Diagram, convert all of the children to polygons
     */
    to_polygon() {
        let newd = this.copy_if_not_mutable();
        if (newd.type == DiagramType.Curve) {
            newd.type = DiagramType.Polygon;
        }
        else if (newd.type == DiagramType.Diagram) {
            // newd.children = newd.children.map(c => c.to_polygon());
            for (let i = 0; i < newd.children.length; i++)
                newd.children[i] = newd.children[i].to_polygon();
        }
        return newd;
    }
    /**
     * Add points to the diagram
     * if the diagram is a polygon or curve, add points to the path
     * if the diagram is a diagram, add points to the last polygon or curve child
     * @param points points to add
     */
    add_points(points) {
        let newd = this.copy_if_not_mutable();
        if (newd.type == DiagramType.Polygon || newd.type == DiagramType.Curve) {
            if (newd.path == undefined) {
                throw new Error(this.type + " must have a path");
            }
            newd.path = newd.path.add_points(points);
        }
        else if (newd.type == DiagramType.Diagram) {
            // add point to the last polygon or curve child
            let last_child = newd.children[newd.children.length - 1];
            newd.children[newd.children.length - 1] = last_child.add_points(points);
        }
        return newd;
    }
    update_style(stylename, stylevalue, excludedType) {
        let newd = this.copy_if_not_mutable();
        if (excludedType === null || excludedType === void 0 ? void 0 : excludedType.includes(newd.type)) {
            return newd;
        }
        else if (newd.type == DiagramType.Polygon || newd.type == DiagramType.Curve
            || newd.type == DiagramType.Text || newd.type == DiagramType.Image
            || newd.type == DiagramType.MultilineText) {
            newd.style[stylename] = stylevalue;
        }
        else if (newd.type == DiagramType.Diagram) {
            // newd.children = newd.children.map(c => c.update_style(stylename, stylevalue, excludedType));
            for (let i = 0; i < newd.children.length; i++)
                newd.children[i] = newd.children[i].update_style(stylename, stylevalue, excludedType);
        }
        else {
            throw new Error("Unreachable, unknown diagram type : " + newd.type);
        }
        return newd;
    }
    /* * Clone style from another diagram */
    clone_style_from(diagram) {
        return this.apply_recursive(d => {
            d.style = Object.assign({}, diagram.style);
            return d;
        });
    }
    fill(color) {
        return this.update_style('fill', color, [DiagramType.Text]);
    }
    stroke(color) {
        return this.update_style('stroke', color, [DiagramType.Text]);
    }
    opacity(opacity) {
        return this.update_style('opacity', opacity.toString());
    }
    strokewidth(width) {
        return this.update_style('stroke-width', width.toString(), [DiagramType.Text]);
    }
    strokelinecap(linecap) {
        return this.update_style('stroke-linecap', linecap);
    }
    strokelinejoin(linejoin) {
        return this.update_style('stroke-linejoin', linejoin);
    }
    strokedasharray(dasharray) {
        return this.update_style('stroke-dasharray', dasharray.join(','));
    }
    vectoreffect(vectoreffect) {
        return this.update_style('vector-effect', vectoreffect);
    }
    textfill(color) {
        return this.update_style('fill', color, [DiagramType.Polygon, DiagramType.Curve]);
    }
    textstroke(color) {
        return this.update_style('stroke', color, [DiagramType.Polygon, DiagramType.Curve]);
    }
    textstrokewidth(width) {
        return this.update_style('stroke-width', width.toString(), [DiagramType.Polygon, DiagramType.Curve]);
    }
    update_textdata(textdataname, textdatavalue) {
        let newd = this.copy_if_not_mutable();
        if (newd.type == DiagramType.Text || newd.type == DiagramType.MultilineText) {
            newd.textdata[textdataname] = textdatavalue;
        }
        else if (newd.type == DiagramType.Diagram) {
            // newd.children = newd.children.map(c => c.update_textdata(textdataname, textdatavalue));
            for (let i = 0; i < newd.children.length; i++)
                newd.children[i] = newd.children[i].update_textdata(textdataname, textdatavalue);
        }
        else if (newd.type == DiagramType.Polygon || newd.type == DiagramType.Curve) ;
        else {
            throw new Error("Unreachable, unknown diagram type : " + newd.type);
        }
        return newd;
    }
    fontfamily(fontfamily) {
        return this.update_textdata('font-family', fontfamily);
    }
    fontstyle(fontstyle) {
        return this.update_textdata('font-style', fontstyle);
    }
    fontsize(fontsize) {
        return this.update_textdata('font-size', fontsize.toString());
    }
    fontweight(fontweight) {
        return this.update_textdata('font-weight', fontweight.toString());
    }
    fontscale(fontscale) {
        return this.update_textdata('font-scale', fontscale.toString());
    }
    textanchor(textanchor) {
        return this.update_textdata('text-anchor', textanchor);
    }
    textdy(dy) {
        return this.update_textdata('dy', dy);
    }
    textangle(angle) {
        return this.update_textdata('angle', angle.toString());
    }
    text_tovar() {
        let newd = this.copy_if_not_mutable();
        if (newd.type == DiagramType.Text) {
            newd = newd.append_tags(TAG.TEXTVAR);
        }
        else if (newd.type == DiagramType.Diagram) {
            // newd.children = newd.children.map(c => c.text_tovar());
            for (let i = 0; i < newd.children.length; i++)
                newd.children[i] = newd.children[i].text_tovar();
        }
        return newd;
    }
    text_totext() {
        let newd = this.copy_if_not_mutable();
        if (newd.type == DiagramType.Text) {
            newd = newd.remove_tags('textvar');
        }
        else if (newd.type == DiagramType.Diagram) {
            // newd.children = newd.children.map(c => c.text_totext());
            for (let i = 0; i < newd.children.length; i++)
                newd.children[i] = newd.children[i].text_totext();
        }
        return newd;
    }
    /**
     * Get the bounding box of the diagram
     * @returns [min, max] where min is the top left corner and max is the bottom right corner
     */
    bounding_box() {
        let minx = Infinity, miny = Infinity;
        let maxx = -Infinity, maxy = -Infinity;
        if (this.type == DiagramType.Diagram) {
            for (let c = 0; c < this.children.length; c++) {
                let child = this.children[c];
                let [min, max] = child.bounding_box();
                minx = Math.min(minx, min.x);
                miny = Math.min(miny, min.y);
                maxx = Math.max(maxx, max.x);
                maxy = Math.max(maxy, max.y);
            }
            return [new Vector2(minx, miny), new Vector2(maxx, maxy)];
        }
        else if (this.type == DiagramType.Curve || this.type == DiagramType.Polygon
            || this.type == DiagramType.Image) {
            if (this.path == undefined) {
                throw new Error(this.type + " must have a path");
            }
            for (let p = 0; p < this.path.points.length; p++) {
                let point = this.path.points[p];
                minx = Math.min(minx, point.x);
                miny = Math.min(miny, point.y);
                maxx = Math.max(maxx, point.x);
                maxy = Math.max(maxy, point.y);
            }
            return [new Vector2(minx, miny), new Vector2(maxx, maxy)];
        }
        else if (this.type == DiagramType.Text || this.type == DiagramType.MultilineText) {
            return [this.origin.copy(), this.origin.copy()];
        }
        else {
            throw new Error("Unreachable, unknown diagram type : " + this.type);
        }
    }
    /**
     * Transform the diagram by a function
     * @param transform_function function to transform the diagram
     */
    transform(transform_function) {
        let newd = this.copy_if_not_mutable();
        // transform all children
        // newd.children = newd.children.map(c => c.transform(transform_function));
        for (let i = 0; i < newd.children.length; i++)
            newd.children[i] = newd.children[i].transform(transform_function);
        // transform path
        if (newd.path != undefined)
            newd.path = newd.path.transform(transform_function);
        // transform origin
        newd.origin = transform_function(newd.origin);
        return newd;
    }
    /**
     * Translate the diagram by a vector
     * @param v vector to translate
     */
    translate(v) {
        return this.transform(Transform.translate(v));
    }
    /**
     * move the diagram to a position
     * @param v position to move to (if left undefined, move to the origin)
     */
    position(v = new Vector2(0, 0)) {
        let dv = v.sub(this.origin);
        return this.translate(dv);
    }
    /**
     * Rotate the diagram by an angle around a pivot
     * @param angle angle to rotate
     * @param pivot pivot point, if left undefined, rotate around the origin
     */
    rotate(angle, pivot = undefined) {
        if (pivot == undefined) {
            pivot = this.origin;
        }
        return this.transform(Transform.rotate(angle, pivot));
    }
    /**
     * Scale the diagram by a scale around a origin
     * @param scale scale to scale (x, y)
     * @param origin origin point, if left undefined, scale around the origin
     */
    scale(scale, origin) {
        if (origin == undefined) {
            origin = this.origin;
        }
        if (typeof scale == 'number') {
            scale = new Vector2(scale, scale);
        }
        return this.transform(Transform.scale(scale, origin));
    }
    /**
     * Scale texts contained in the diagram by a scale
     * @param scale scaling factor
     */
    scaletext(scale) {
        return this.apply_recursive(d => {
            switch (d.type) {
                case DiagramType.Text: {
                    let fontsize = parseFloat(d.textdata['font-size'] || DEFAULT_FONTSIZE);
                    let newd = d.copy_if_not_mutable();
                    newd.textdata['font-size'] = (fontsize * scale).toString();
                    return newd;
                }
                case DiagramType.MultilineText: {
                    let newd = d.copy_if_not_mutable();
                    newd.multilinedata['scale-factor'] = (newd.multilinedata['scale-factor'] || 1) * scale;
                    return newd;
                }
                default: return d;
            }
        });
    }
    /**
     * Skew the diagram in the x direction by an angle around a base
     * @param angle angle to skew
     * @param base base point, if left undefined, skew around the origin
     */
    skewX(angle, base) {
        if (base == undefined) {
            base = this.origin;
        }
        return this.transform(Transform.skewX(angle, base.y));
    }
    /**
     * Skew the diagram in the y direction by an angle around a base
     * @param angle angle to skew
     * @param base base point, if left undefined, skew around the origin
     */
    skewY(angle, base) {
        if (base == undefined) {
            base = this.origin;
        }
        return this.transform(Transform.skewY(angle, base.x));
    }
    /**
     * Reflect the diagram over a point
     * @param p point to reflect over
     */
    reflect_over_point(p) {
        return this.transform(Transform.reflect_over_point(p));
    }
    /**
     * Reflect the diagram over a line defined by two points
     * @param p1 point on the line
     * @param p2 point on the line
     */
    reflect_over_line(p1, p2) {
        return this.transform(Transform.reflect_over_line(p1, p2));
    }
    /**
     * Reflect the diagram
     * if given 0 arguments, reflect over the origin
     * if given 1 argument, reflect over a point p1
     * if given 2 arguments, reflect over a line defined by two points p1 and p2
     * @param p1 point
     * @param p2 point
     */
    reflect(p1, p2) {
        if (p1 == undefined && p2 == undefined) {
            return this.reflect_over_point(this.origin);
        }
        else if (p1 != undefined && p2 == undefined) {
            return this.reflect_over_point(p1);
        }
        else if (p1 != undefined && p2 != undefined) {
            return this.reflect_over_line(p1, p2);
        }
        else {
            throw new Error("Unreachable");
        }
    }
    /**
     * Vertical flip
     * Reflect the diagram over a horizontal line y = a
     * @param a y value of the line
     * if left undefined, flip over the origin
     */
    vflip(a) {
        if (a == undefined) {
            a = this.origin.y;
        }
        return this.reflect(new Vector2(0, a), new Vector2(1, a));
    }
    /**
     * Horizontal flip
     * Reflect the diagram over a vertical line x = a
     * @param a x value of the line
     * if left undefined, flip over the origin
     */
    hflip(a) {
        if (a == undefined) {
            a = this.origin.x;
        }
        return this.reflect(new Vector2(a, 0), new Vector2(a, 1));
    }
    /**
     * Get the position of the anchor of the diagram
     * @param anchor anchor to get, anchors can be
     *   'top-left', 'top-center', 'top-right'
     *   'center-left', 'center-center', 'center-right'
     *   'bottom-left', 'bottom-center', 'bottom-right'
     * @returns the position of the anchor
     */
    get_anchor(anchor) {
        let [min, max] = this.bounding_box();
        let minx = min.x, miny = min.y;
        let maxx = max.x, maxy = max.y;
        let midx = (minx + maxx) / 2;
        let midy = (miny + maxy) / 2;
        switch (anchor) {
            case "top-left": return new Vector2(minx, maxy);
            case "top-center": return new Vector2(midx, maxy);
            case "top-right": return new Vector2(maxx, maxy);
            case "center-left": return new Vector2(minx, midy);
            case "center-center": return new Vector2(midx, midy);
            case "center-right": return new Vector2(maxx, midy);
            case "bottom-left": return new Vector2(minx, miny);
            case "bottom-center": return new Vector2(midx, miny);
            case "bottom-right": return new Vector2(maxx, miny);
            default: throw new Error("Unknown anchor " + anchor);
        }
    }
    /**
     * Move the origin of the diagram to a position or anchor
     * @param pos position to move the origin to (Vector2), or anchor to move the origin to.
     * anchors can be
     *  'top-left', 'top-center', 'top-right'
     *  'center-left', 'center-center', 'center-right'
     *  'bottom-left', 'bottom-center', 'bottom-right'
     * * for texts, use `move_origin_text()`
     */
    move_origin(pos) {
        let newd = this.copy_if_not_mutable();
        if (pos instanceof Vector2) {
            newd.origin = pos;
        }
        else {
            newd.origin = newd.get_anchor(pos);
        }
        return newd;
    }
    /**
     * Move the origin of text diagram to an anchor
     * @param anchor anchor to move the origin to.
     * anchors can be
     * 'top-left', 'top-center', 'top-right'
     * 'center-left', 'center-center', 'center-right'
     * 'bottom-left', 'bottom-center', 'bottom-right'
     */
    __move_origin_text(anchor) {
        // for text, use text-anchor and dominant-baseline
        let newd = this.copy_if_not_mutable();
        let textdata = anchor_to_textdata(anchor);
        newd.textdata['text-anchor'] = textdata['text-anchor'];
        newd.textdata['dy'] = textdata['dy'];
        return newd;
    }
    /**
     * Move the origin of text diagram to a position
     * @param anchor anchor to move the origin to.
     * anchors can be
     * 'top-left', 'top-center', 'top-right'
     * 'center-left', 'center-center', 'center-right'
     * 'bottom-left', 'bottom-center', 'bottom-right'
     *
     */
    move_origin_text(anchor) {
        let newd = this.copy_if_not_mutable();
        if (this.type == DiagramType.Text || this.type == DiagramType.MultilineText) {
            newd = newd.__move_origin_text(anchor);
        }
        else if (this.type == DiagramType.Diagram) {
            //newd.children = newd.children.map(c => c.move_origin_text(anchor));
            for (let i = 0; i < newd.children.length; i++)
                newd.children[i] = newd.children[i].move_origin_text(anchor);
        }
        else ;
        return newd;
    }
    path_length() {
        if (this.type == DiagramType.Diagram) {
            let length = 0;
            for (let c = 0; c < this.children.length; c++) {
                length += this.children[c].path_length();
            }
            return length;
        }
        else if (this.type == DiagramType.Curve || this.type == DiagramType.Polygon) {
            if (this.path == undefined) {
                throw new Error(this.type + " must have a path");
            }
            return this.path.length();
        }
        else {
            throw new Error("Unreachable, unknown diagram type : " + this.type);
        }
    }
    /**
     * Get the point on the path at t
     * Path can be described parametrically in the form of (x(t), y(t))
     * Path starts at t=0 and ends at t=1
     * @param t parameter
     * @param segment_index (only works for polygon and curves)
     * If segment_index (n) is defined, get the point at the nth segment
     * If segment_index (n) is defined, t can be outside of [0, 1] and will return the extrapolated point
     * @returns the position of the point
     */
    parametric_point(t, segment_index) {
        if (this.type == DiagramType.Diagram) {
            // use entire length, use the childrens
            let cumuative_length = [];
            let length = 0.0;
            for (let c = 0; c < this.children.length; c++) {
                length += this.children[c].path_length();
                cumuative_length.push(length);
            }
            let total_length = length;
            let cumulative_t = cumuative_length.map(l => l / total_length);
            // figure out which children t is in
            for (let i = 0; i < cumulative_t.length; i++) {
                if (t <= cumulative_t[i]) {
                    let child_id = i;
                    let prev_t = (i == 0) ? 0 : cumulative_t[i - 1];
                    let segment_t = (t - prev_t) / (cumulative_t[i] - prev_t);
                    return this.children[child_id].parametric_point(segment_t);
                }
            }
            throw Error("Unreachable");
        }
        else if (this.type == DiagramType.Curve) {
            // get the point on the path
            if (this.path == undefined) {
                throw new Error(this.type + " must have a path");
            }
            return this.path.parametric_point(t, false, segment_index);
        }
        else if (this.type == DiagramType.Polygon) {
            // get the point on the path
            if (this.path == undefined) {
                throw new Error(this.type + " must have a path");
            }
            return this.path.parametric_point(t, true, segment_index);
        }
        else {
            throw new Error("Unreachable, unknown diagram type : " + this.type);
        }
    }
    debug_bbox() {
        // TODO : let user supply the styling function
        let style_bbox = (d) => {
            return d.fill('none').stroke('gray').strokedasharray([5, 5]);
        };
        let [min, max] = this.bounding_box();
        let rect_bbox = polygon([
            new Vector2(min.x, min.y), new Vector2(max.x, min.y),
            new Vector2(max.x, max.y), new Vector2(min.x, max.y)
        ]).apply(style_bbox);
        let origin_x = text('+').position(this.origin);
        return rect_bbox.combine(origin_x);
    }
    debug(show_index = true) {
        // TODO : let user supply the styling function
        let style_path = (d) => {
            return d.fill('none').stroke('red').strokedasharray([5, 5]);
        };
        let style_index = (d) => {
            let bg = d.textfill('white').textstroke('white').textstrokewidth(5);
            let dd = d.fill('black');
            return bg.combine(dd);
        };
        // handle each type separately
        if (this.type == DiagramType.Diagram) {
            return this.debug_bbox();
        }
        else if (this.type == DiagramType.Text) {
            // return empty at diagram origin
            return empty(this.origin);
        }
        else if (this.type == DiagramType.Polygon || this.type == DiagramType.Curve
            || this.type == DiagramType.Image) {
            let f_obj = this.type == DiagramType.Polygon || DiagramType.Image ? polygon : curve;
            let deb_bbox = this.debug_bbox();
            if (this.path == undefined) {
                throw new Error(this.type + " must have a path");
            }
            let deb_object = f_obj(this.path.points).apply(style_path);
            // if show_index is false, return only the bbox and polygon
            if (show_index == false) {
                return deb_bbox.combine(deb_object);
            }
            // iterate for all path points
            let points = this.path.points;
            // let point_texts = points.map((p, i) => text(i.toString()).position(p).apply(style_index));
            let point_texts = [];
            let prev_point = undefined;
            let [min, max] = this.bounding_box();
            let minimum_dist_tolerance = Math.min(max.x - min.x, max.y - min.y) / 10;
            for (let i = 0; i < points.length; i++) {
                // push to point_texts only if far enough from prev_point
                let dist_to_prev = prev_point == undefined ? Infinity : points[i].sub(prev_point).length();
                if (dist_to_prev < minimum_dist_tolerance)
                    continue;
                point_texts.push(text(i.toString()).position(points[i]).apply(style_index));
                prev_point = points[i];
            }
            return deb_bbox.combine(deb_object, ...point_texts);
        }
        else {
            throw new Error("Unreachable, unknown diagram type : " + this.type);
        }
    }
}
class Path {
    constructor(points) {
        this.points = points;
        this.mutable = false;
    }
    copy() {
        let newpoints = this.points.map(p => new Vector2(p.x, p.y));
        return new Path(newpoints);
    }
    copy_if_not_mutable() {
        return this.mutable ? this : this.copy();
    }
    /**
     * Get the length of the path
     */
    length() {
        let length = 0;
        for (let i = 1; i < this.points.length; i++) {
            length += this.points[i].sub(this.points[i - 1]).length();
        }
        return length;
    }
    /**
     * add points to the path
     * @param points points to add
     */
    add_points(points) {
        let newp = this.copy_if_not_mutable();
        newp.points = newp.points.concat(points);
        return newp;
    }
    /**
     * Get the point on the path at t
     * Path can be described parametrically in the form of (x(t), y(t))
     * Path starts at t=0 and ends at t=1
     * @param t parameter
     * @param closed if true, the path is closed
     * @param segment_index
     * If `segment_index` (n) is defined, get the point at the nth segment.
     * If `segment_index` (n) is defined, t can be outside of [0, 1] and will return the extrapolated point.
     * @returns the position of the point
    */
    parametric_point(t, closed = false, segment_index) {
        let extended_points = this.points;
        if (closed)
            extended_points = this.points.concat(this.points[0]);
        // for a closed path, there's an extra segment connecting the last point to the first point
        if (segment_index == undefined) {
            if (t < 0 || t > 1) {
                throw Error("t must be between 0 and 1");
            }
            // use entire length
            let cumulative_length = [];
            let length = 0.0;
            for (let i = 1; i < extended_points.length; i++) {
                length += extended_points[i].sub(extended_points[i - 1]).length();
                cumulative_length.push(length);
            }
            let total_length = length;
            let cumulative_t = cumulative_length.map(l => l / total_length);
            // figure out which segment t is in
            for (let i = 0; i < cumulative_t.length; i++) {
                if (t <= cumulative_t[i]) {
                    let segment_id = i;
                    let prev_t = (i == 0) ? 0 : cumulative_t[i - 1];
                    let segment_t = (t - prev_t) / (cumulative_t[i] - prev_t);
                    return this.parametric_point(segment_t, closed, segment_id);
                }
            }
            // segment must have been retrieved at this point
            throw Error("Unreachable");
        }
        else {
            // take nth segment
            if (segment_index < 0 || segment_index > extended_points.length - 1) {
                throw Error("segment_index must be between 0 and n-1");
            }
            let start = extended_points[segment_index];
            let end = extended_points[segment_index + 1];
            let dir = end.sub(start);
            return start.add(dir.scale(t));
        }
    }
    /**
     * Tranfrom the path by a function
     * @param transform_function function to transform the path
     */
    transform(transform_function) {
        let newp = this.copy_if_not_mutable();
        // transform all the points
        // newp.points = newp.points.map(p => transform_function(p));
        for (let i = 0; i < newp.points.length; i++)
            newp.points[i] = transform_function(newp.points[i]);
        return newp;
    }
}
/**
 * Combine multiple diagrams into one diagram
 * @param diagrams list of diagrams to combine
 * @returns a diagram
 */
function diagram_combine(...diagrams) {
    if (diagrams.length == 0) {
        return empty();
    }
    let newdiagrams = diagrams.map(d => d.copy_if_not_mutable());
    // check if all children is mutable
    // if they are, then set the new diagram to be mutable
    let all_children_mutable = true;
    for (let i = 0; i < newdiagrams.length; i++) {
        if (!newdiagrams[i].mutable) {
            all_children_mutable = false;
            break;
        }
    }
    let newd = new Diagram(DiagramType.Diagram, { children: newdiagrams });
    newd.mutable = all_children_mutable;
    return newd.move_origin(diagrams[0].origin);
    // return newd.move_origin(Anchor.CenterCenter);
    // i think it's better to keep the origin at the origin of the first diagram
}
// ====== function helpers to create primitives =========
/**
 * Create a curve from a list of points
 * @param points list of points
 * @returns a curve diagram
 */
function curve(points) {
    let path = new Path(points);
    let curve = new Diagram(DiagramType.Curve, { path: path });
    return curve;
}
/**
 * Create a line from start to end
 * @param start start point
 * @param end end point
 * @returns a line diagram
 */
function line$1(start, end) {
    return curve([start, end]).append_tags(TAG.LINE);
}
/**
 * Create a polygon from a list of points
 * @param points list of points
 * @param names list of names for each path
 * @returns a polygon diagram
 */
function polygon(points) {
    assert(points.length >= 3, "Polygon must have at least 3 points");
    let path = new Path(points);
    // create diagram
    let polygon = new Diagram(DiagramType.Polygon, { path: path });
    return polygon;
}
/**
 * Create an empty diagram, contain just a single point
 * @param v position of the point
 * @returns an empty diagram
 */
function empty(v = V2$5(0, 0)) {
    let emp = curve([v]);
    return emp;
}
/**
 * Create a text diagram
 * @param str text to display
 * @returns a text diagram
 */
function text(str) {
    let dtext = new Diagram(DiagramType.Text, {
        textdata: { text: str, "font-size": DEFAULT_FONTSIZE },
        path: new Path([new Vector2(0, 0)]),
    });
    return dtext;
}
/**
 * Create an image diagram
 * @param src image source
 * @param width width of the image
 * @param height height of the image
 * @returns an image diagram
 */
function image(src, width, height) {
    let imgdata = { src };
    // path: bottom-left, bottom-right, top-right, top-left
    let path = new Path([
        V2$5(-width / 2, -height / 2), V2$5(width / 2, -height / 2),
        V2$5(width / 2, height / 2), V2$5(-width / 2, height / 2),
    ]);
    let img = new Diagram(DiagramType.Image, { imgdata: imgdata, path: path });
    return img;
}
/**
 * Create a multiline text diagram
 * @param strs list of text to display
 */
function multiline(spans) {
    var _a;
    let tspans = [];
    for (let i = 0; i < spans.length; i++) {
        let text = spans[i][0];
        let style = (_a = spans[i][1]) !== null && _a !== void 0 ? _a : {};
        tspans.push({ text, style });
    }
    let dmulti = new Diagram(DiagramType.MultilineText, {
        multilinedata: { content: tspans, "scale-factor": 1 },
        path: new Path([new Vector2(0, 0)]),
    });
    return dmulti;
}
function multiline_bb(bbstr, linespace) {
    let tspans = BB_multiline.from_BBCode(bbstr, linespace);
    let dmulti = new Diagram(DiagramType.MultilineText, {
        multilinedata: { content: tspans, "scale-factor": 1 },
        path: new Path([new Vector2(0, 0)]),
    });
    return dmulti;
}

/**
 * Helper function to convert from degrees to radians
 */
function to_radian(angle) {
    return angle * Math.PI / 180;
}
/**
 * Helper function to convert from radians to degrees
 */
function to_degree(angle) {
    return angle * 180 / Math.PI;
}
function array_repeat(arr, len) {
    let new_arr = [];
    for (let i = 0; i < len; i++) {
        new_arr.push(arr[i % arr.length]);
    }
    return new_arr;
}
/**
 * Create a equivalently spaced array of numbers from start to end (inclusive)
 * [start, end]
 * @param start start value
 * @param end end value
 * @param n number of points
 */
function linspace(start, end, n = 100) {
    let result = [];
    let step = (end - start) / (n - 1);
    for (let i = 0; i < n; i++) {
        result.push(start + step * i);
    }
    return result;
}
/**
 * Create a equivalently spaced array of numbers from start to end (exclusice)
 * [start, end)
 * @param start start value
 * @param end end value
 * @param n number of points
 */
function linspace_exc(start, end, n = 100) {
    let result = [];
    let step = (end - start) / n;
    for (let i = 0; i < n; i++) {
        result.push(start + step * i);
    }
    return result;
}
/**
 * Create a equivalently spaced array of numbers from start to end (exclusive)
 * [start, end)
 * @param start start value
 * @param end end value
 * @param step step size
 */
function range(start, end, step = 1) {
    // step cannot be 0 and cannot be in the wrong direction
    if (step == 0)
        return [];
    let n = Math.floor((end - start) / step);
    if (n <= 0)
        return [];
    let result = [];
    if (step > 0) {
        for (let i = start; i < end; i += step) {
            result.push(i);
        }
    }
    else {
        for (let i = start; i > end; i += step) {
            result.push(i);
        }
    }
    return result;
}
/**
 * Create a equivalently spaced array of numbers from start to end (inc)
 * [start, end]
 * @param start start value
 * @param end end value
 * @param step step size
 */
function range_inc(start, end, step = 1) {
    // step cannot be 0 and cannot be in the wrong direction
    if (step == 0)
        return [];
    let n = Math.floor((end - start) / step);
    if (n <= 0)
        return [];
    let result = [];
    if (step > 0) {
        for (let i = start; i <= end; i += step) {
            result.push(i);
        }
    }
    else {
        for (let i = start; i >= end; i += step) {
            result.push(i);
        }
    }
    return result;
}
/**
 * Transpose a 2D array
 * if the array is not a rectangle, the transposed array will be padded with undefined
 * @param arr 2D array
 * @returns transposed 2D array
 */
function transpose(arr) {
    let result = [];
    let n = Math.max(...arr.map(a => a.length));
    for (let i = 0; i < n; i++) {
        result.push([]);
        for (let j = 0; j < arr.length; j++) {
            result[i].push(arr[j][i]);
        }
    }
    return result;
}
// interpolations
/**
 * Cubic spline interpolation
 * @param points array of points to interpolate
 * @param n number of points to interpolate between each pair of points (default 10)
 * @returns array of interpolated points
 */
function cubic_spline(points, n = 10) {
    const n_points = points.length;
    let a = points.map(p => p.y);
    let b = new Array(n_points).fill(0);
    let d = new Array(n_points).fill(0);
    let h = new Array(n_points - 1);
    for (let i = 0; i < n_points - 1; i++) {
        h[i] = points[i + 1].x - points[i].x;
    }
    // Solve tridiagonal system for the c[i] coefficients (second derivatives)
    let alpha = new Array(n_points - 1).fill(0);
    let c = new Array(n_points).fill(0);
    let l = new Array(n_points).fill(1);
    let mu = new Array(n_points).fill(0);
    let z = new Array(n_points).fill(0);
    for (let i = 1; i < n_points - 1; i++) {
        alpha[i] = (3 / h[i]) * (a[i + 1] - a[i]) - (3 / h[i - 1]) * (a[i] - a[i - 1]);
    }
    for (let i = 1; i < n_points - 1; i++) {
        l[i] = 2 * (points[i + 1].x - points[i - 1].x) - h[i - 1] * mu[i - 1];
        mu[i] = h[i] / l[i];
        z[i] = (alpha[i] - h[i - 1] * z[i - 1]) / l[i];
    }
    // Back substitution
    for (let j = n_points - 2; j >= 0; j--) {
        c[j] = z[j] - mu[j] * c[j + 1];
        b[j] = (a[j + 1] - a[j]) / h[j] - h[j] * (c[j + 1] + 2 * c[j]) / 3;
        d[j] = (c[j + 1] - c[j]) / (3 * h[j]);
    }
    // Now that we have coefficients, we can construct the spline between each pair of points
    let spline_points = [];
    for (let i = 0; i < n_points - 1; i++) {
        for (let j = 0; j <= n; j++) {
            let x = points[i].x + j * (points[i + 1].x - points[i].x) / n;
            let y = a[i] + b[i] * (x - points[i].x) + c[i] * Math.pow(x - points[i].x, 2) + d[i] * Math.pow(x - points[i].x, 3);
            spline_points.push(V2$5(x, y));
        }
    }
    return spline_points;
}

var utils = /*#__PURE__*/Object.freeze({
    __proto__: null,
    array_repeat: array_repeat,
    cubic_spline: cubic_spline,
    linspace: linspace,
    linspace_exc: linspace_exc,
    range: range,
    range_inc: range_inc,
    to_degree: to_degree,
    to_radian: to_radian,
    transpose: transpose
});

// color from matpltlib's tab20
const tab_color = {
    'blue': '#1f77b4',
    'lightblue': '#aec7e8',
    'orange': '#ff7f0e',
    'lightorange': '#ffbb78',
    'green': '#2ca02c',
    'lightgreen': '#98df8a',
    'red': '#d62728',
    'lightred': '#ff9896',
    'purple': '#9467bd',
    'lightpurple': '#c5b0d5',
    'brown': '#8c564b',
    'lightbrown': '#c49c94',
    'pink': '#e377c2',
    'lightpink': '#f7b6d2',
    'grey': '#7f7f7f',
    'lightgrey': '#c7c7c7',
    'gray': '#7f7f7f',
    'lightgray': '#c7c7c7',
    'olive': '#bcbd22',
    'lightolive': '#dbdb8d',
    'cyan': '#17becf',
    'lightcyan': '#9edae5',
};
function get_color(colorname, palette) {
    var _a;
    return (_a = palette[colorname]) !== null && _a !== void 0 ? _a : colorname;
}

const unicode_mathematical_italic = {
    'A': '𝐴', 'B': '𝐵', 'C': '𝐶', 'D': '𝐷', 'E': '𝐸',
    'F': '𝐹', 'G': '𝐺', 'H': '𝐻', 'I': '𝐼', 'J': '𝐽',
    'K': '𝐾', 'L': '𝐿', 'M': '𝑀', 'N': '𝑁', 'O': '𝑂',
    'P': '𝑃', 'Q': '𝑄', 'R': '𝑅', 'S': '𝑆', 'T': '𝑇',
    'U': '𝑈', 'V': '𝑉', 'W': '𝑊', 'X': '𝑋', 'Y': '𝑌', 'Z': '𝑍',
    'a': '𝑎', 'b': '𝑏', 'c': '𝑐', 'd': '𝑑', 'e': '𝑒',
    'f': '𝑓', 'g': '𝑔', 'h': 'ℎ', 'i': '𝑖', 'j': '𝑗',
    'k': '𝑘', 'l': '𝑙', 'm': '𝑚', 'n': '𝑛', 'o': '𝑜',
    'p': '𝑝', 'q': '𝑞', 'r': '𝑟', 's': '𝑠', 't': '𝑡',
    'u': '𝑢', 'v': '𝑣', 'w': '𝑤', 'x': '𝑥', 'y': '𝑦', 'z': '𝑧',
    'Α': '𝛢', 'Β': '𝛣', 'Γ': '𝛤', 'Δ': '𝛥', 'Ε': '𝛦',
    'Ζ': '𝛧', 'Η': '𝛨', 'Θ': '𝛩', 'Ι': '𝛪', 'Κ': '𝛫',
    'Λ': '𝛬', 'Μ': '𝛭', 'Ν': '𝛮', 'Ξ': '𝛯', 'Ο': '𝛰',
    'Π': '𝛱', 'Ρ': '𝛲', 'Σ': '𝛴', 'Τ': '𝛵', 'Υ': '𝛶',
    'Φ': '𝛷', 'Χ': '𝛸', 'Ψ': '𝛹', 'Ω': '𝛺',
    'α': '𝛼', 'β': '𝛽', 'γ': '𝛾', 'δ': '𝛿', 'ε': '𝜀',
    'ζ': '𝜁', 'η': '𝜂', 'θ': '𝜃', 'ι': '𝜄', 'κ': '𝜅',
    'λ': '𝜆', 'μ': '𝜇', 'ν': '𝜈', 'ξ': '𝜉', 'ο': '𝜊',
    'π': '𝜋', 'ρ': '𝜌', 'ς': '𝜍', 'σ': '𝜎', 'τ': '𝜏', 'υ': '𝜐',
    'φ': '𝜑', 'χ': '𝜒', 'ψ': '𝜓', 'ω': '𝜔',
    'ϑ': '𝜗', 'ϰ': '𝜘', 'ϕ': '𝜙', 'ϱ': '𝜚', 'ϖ': '𝜛',
    // '.' : '𝛻', '.' : '𝛳', '.' : '𝜕', '.' : '𝜖',
};
Object.fromEntries(Object.entries(unicode_mathematical_italic).map(([k, v]) => [v, k]));
const latex_greek = {
    '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ', '\\delta': 'δ', '\\epsilon': 'ε',
    '\\zeta': 'ζ', '\\eta': 'η', '\\theta': 'θ', '\\iota': 'ι', '\\kappa': 'κ',
    '\\lambda': 'λ', '\\mu': 'μ', '\\nu': 'ν', '\\xi': 'ξ', '\\omicron': 'ο',
    '\\pi': 'π', '\\rho': 'ρ', '\\sigma': 'σ', '\\tau': 'τ', '\\upsilon': 'υ',
    '\\phi': 'ϕ', '\\chi': 'χ', '\\psi': 'ψ', '\\omega': 'ω',
    '\\vartheta': 'ϑ', '\\varchi': 'ϰ', '\\varphi': 'φ', '\\varepsilon': 'ε',
    '\\varrho': 'ϱ', '\\varsigma': 'ς',
};
const latex_symbols = {
    "textfractionsolidus": "⁄",
    "leftrightsquigarrow": "↭",
    "textpertenthousand": "‱",
    "blacktriangleright": "▸",
    "blacktriangledown": "▾",
    "blacktriangleleft": "◂",
    "twoheadrightarrow": "↠",
    "leftrightharpoons": "⇋",
    "rightleftharpoons": "⇌",
    "textreferencemark": "※",
    "circlearrowright": "↻",
    "rightrightarrows": "⇉",
    "vartriangleright": "⊳",
    "textordmasculine": "º",
    "textvisiblespace": "␣",
    "twoheadleftarrow": "↞",
    "downharpoonright": "⇂",
    "ntrianglerighteq": "⋭",
    "rightharpoondown": "⇁",
    "textperthousand": "‰",
    "leftrightarrows": "⇆",
    "textmusicalnote": "♪",
    "nleftrightarrow": "↮",
    "rightleftarrows": "⇄",
    "bigtriangledown": "▽",
    "textordfeminine": "ª",
    "ntrianglelefteq": "⋬",
    "rightthreetimes": "⋌",
    "trianglerighteq": "⊵",
    "vartriangleleft": "⊲",
    "rightsquigarrow": "⇝",
    "downharpoonleft": "⇃",
    "curvearrowright": "↷",
    "circlearrowleft": "↺",
    "leftharpoondown": "↽",
    "nLeftrightarrow": "⇎",
    "curvearrowleft": "↶",
    "guilsinglright": "›",
    "leftthreetimes": "⋋",
    "leftrightarrow": "↔",
    "rightharpoonup": "⇀",
    "guillemotright": "»",
    "downdownarrows": "⇊",
    "hookrightarrow": "↪",
    "dashrightarrow": "⇢",
    "leftleftarrows": "⇇",
    "trianglelefteq": "⊴",
    "ntriangleright": "⋫",
    "doublebarwedge": "⌆",
    "upharpoonright": "↾",
    "rightarrowtail": "↣",
    "looparrowright": "↬",
    "Leftrightarrow": "⇔",
    "sphericalangle": "∢",
    "divideontimes": "⋇",
    "measuredangle": "∡",
    "blacktriangle": "▴",
    "ntriangleleft": "⋪",
    "mathchar1356": "⁁",
    "texttrademark": "™",
    "mathchar2208": "⌖",
    "triangleright": "▹",
    "leftarrowtail": "↢",
    "guilsinglleft": "‹",
    "upharpoonleft": "↿",
    "mathbb{gamma}": "ℽ",
    "fallingdotseq": "≒",
    "looparrowleft": "↫",
    "textbrokenbar": "¦",
    "hookleftarrow": "↩",
    "smallsetminus": "﹨",
    "dashleftarrow": "⇠",
    "guillemotleft": "«",
    "leftharpoonup": "↼",
    "mathbb{Gamma}": "ℾ",
    "bigtriangleup": "△",
    "textcircledP": "℗",
    "risingdotseq": "≓",
    "triangleleft": "◃",
    "mathsterling": "£",
    "textcurrency": "¤",
    "triangledown": "▿",
    "blacklozenge": "",
    "sfrac{5}{6}": "⅚",
    "preccurlyeq": "≼",
    "Rrightarrow": "⇛",
    "circledcirc": "⊚",
    "nRightarrow": "⇏",
    "sfrac{3}{8}": "⅜",
    "sfrac{1}{3}": "⅓",
    "sfrac{2}{5}": "⅖",
    "vartriangle": "▵",
    "Updownarrow": "⇕",
    "nrightarrow": "↛",
    "sfrac{1}{2}": "½",
    "sfrac{3}{5}": "⅗",
    "succcurlyeq": "≽",
    "sfrac{4}{5}": "⅘",
    "diamondsuit": "♦",
    "sfrac{1}{6}": "⅙",
    "curlyeqsucc": "⋟",
    "blacksquare": "▪",
    "curlyeqprec": "⋞",
    "sfrac{1}{8}": "⅛",
    "sfrac{7}{8}": "⅞",
    "sfrac{1}{5}": "⅕",
    "sfrac{2}{3}": "⅔",
    "updownarrow": "↕",
    "backepsilon": "∍",
    "circleddash": "⊝",
    "eqslantless": "⋜",
    "sfrac{3}{4}": "¾",
    "sfrac{5}{8}": "⅝",
    "sfrac{1}{4}": "¼",
    "mathbb{Pi}": "ℿ",
    "mathcal{M}": "ℳ",
    "mathcal{o}	": "ℴ",
    "mathcal{O}	": "𝒪",
    "nsupseteqq": "⊉",
    "mathcal{B}": "ℬ",
    "textrecipe": "℞",
    "nsubseteqq": "⊈",
    "subsetneqq": "⊊",
    "mathcal{I}": "ℑ",
    "upuparrows": "⇈",
    "mathcal{e}": "ℯ",
    "mathcal{L}": "ℒ",
    "nleftarrow": "↚",
    "mathcal{H}": "ℋ",
    "mathcal{E}": "ℰ",
    "eqslantgtr": "⋝",
    "curlywedge": "⋏",
    "varepsilon": "ε",
    "supsetneqq": "⊋",
    "rightarrow": "→",
    "mathcal{R}": "ℛ",
    "sqsubseteq": "⊑",
    "mathcal{g}": "ℊ",
    "sqsupseteq": "⊒",
    "complement": "∁",
    "Rightarrow": "⇒",
    "gtreqqless": "⋛",
    "lesseqqgtr": "⋚",
    "circledast": "⊛",
    "nLeftarrow": "⇍",
    "Lleftarrow": "⇚",
    "varnothing": "∅",
    "mathcal{N}": "𝒩",
    "Leftarrow": "⇐",
    "gvertneqq": "≩",
    "mathbb{C}": "ℂ",
    "supsetneq": "⊋",
    "leftarrow": "←",
    "nleqslant": "≰",
    "mathbb{Q}": "ℚ",
    "mathbb{Z}": "ℤ",
    "llbracket": "〚",
    "mathbb{H}": "ℍ",
    "spadesuit": "♠",
    "mathit{o}": "ℴ",
    "mathbb{P}": "ℙ",
    "rrbracket": "〛",
    "supseteqq": "⊇",
    "copyright": "©",
    "textsc{k}": "ĸ",
    "gtreqless": "⋛",
    "mathbb{j}": "ⅉ",
    "pitchfork": "⋔",
    "estimated": "℮",
    "ngeqslant": "≱",
    "mathbb{e}": "ⅇ",
    "therefore": "∴",
    "triangleq": "≜",
    "varpropto": "∝",
    "subsetneq": "⊊",
    "heartsuit": "♥",
    "mathbb{d}": "ⅆ",
    "lvertneqq": "≨",
    "checkmark": "✓",
    "nparallel": "∦",
    "mathbb{R}": "ℝ",
    "lesseqgtr": "⋚",
    "downarrow": "↓",
    "mathbb{D}": "ⅅ",
    "mathbb{i}": "ⅈ",
    "backsimeq": "⋍",
    "mathbb{N}": "ℕ",
    "Downarrow": "⇓",
    "subseteqq": "⊆",
    "setminus": "∖",
    "succnsim": "⋩",
    "doteqdot": "≑",
    "clubsuit": "♣",
    "emptyset": "∅",
    "sqsupset": "⊐",
    "fbox{~~}": "▭",
    "curlyvee": "⋎",
    "varkappa": "ϰ",
    "llcorner": "⌞",
    "varsigma": "ς",
    "approxeq": "≊",
    "backcong": "≌",
    "supseteq": "⊇",
    "circledS": "Ⓢ",
    "circledR": "®",
    "textcent": "¢",
    "urcorner": "⌝",
    "lrcorner": "⌟",
    "boxminus": "⊟",
    "texteuro": "€",
    "vartheta": "ϑ",
    "barwedge": "⊼",
    "ding{86}": "✶",
    "sqsubset": "⊏",
    "subseteq": "⊆",
    "intercal": "⊺",
    "ding{73}": "☆",
    "ulcorner": "⌜",
    "recorder": "⌕",
    "precnsim": "⋨",
    "parallel": "∥",
    "boxtimes": "⊠",
    "ding{55}": "✗",
    "multimap": "⊸",
    "maltese": "✠",
    "nearrow": "↗",
    "swarrow": "↙",
    "lozenge": "◊",
    "sqrt[3]": "∛",
    "succsim": "≿",
    "dotplus": "∔",
    "tilde{}": "~",
    "check{}": "ˇ",
    "lessgtr": "≶",
    "Upsilon": "ϒ",
    "Cdprime": "Ъ",
    "gtrless": "≷",
    "backsim": "∽",
    "nexists": "∄",
    "searrow": "↘",
    "lessdot": "⋖",
    "boxplus": "⊞",
    "upsilon": "υ",
    "epsilon": "ε",
    "diamond": "⋄",
    "bigstar": "★",
    "ddagger": "‡",
    "cdprime": "ъ",
    "Uparrow": "⇑",
    "sqrt[4]": "∜",
    "between": "≬",
    "sqangle": "∟",
    "digamma": "Ϝ",
    "uparrow": "↑",
    "nwarrow": "↖",
    "precsim": "≾",
    "breve{}": "˘",
    "because": "∵",
    "bigcirc": "◯",
    "acute{}": "´",
    "grave{}": "`",
    "lesssim": "≲",
    "partial": "∂",
    "natural": "♮",
    "supset": "⊃",
    "hstrok": "ħ",
    "Tstrok": "Ŧ",
    "coprod": "∐",
    "models": "⊧",
    "otimes": "⊗",
    "degree": "°",
    "gtrdot": "⋗",
    "preceq": "≼",
    "Lambda": "Λ",
    "lambda": "λ",
    "cprime": "ь",
    "varrho": "ϱ",
    "Bumpeq": "≎",
    "hybull": "⁃",
    "lmidot": "ŀ",
    "nvdash": "⊬",
    "lbrace": "{",
    "bullet": "•",
    "varphi": "φ",
    "bumpeq": "≏",
    "ddot{}": "¨",
    "Lmidot": "Ŀ",
    "Cprime": "Ь",
    "female": "♀",
    "rtimes": "⋊",
    "gtrsim": "≳",
    "mapsto": "↦",
    "daleth": "ℸ",
    "square": "■",
    "nVDash": "⊯",
    "rangle": "⟩",
    "tstrok": "ŧ",
    "oslash": "⊘",
    "ltimes": "⋉",
    "lfloor": "⌊",
    "marker": "▮",
    "Subset": "⋐",
    "Vvdash": "⊪",
    "propto": "∝",
    "Hstrok": "Ħ",
    "dlcrop": "⌍",
    "forall": "∀",
    "nVdash": "⊮",
    "Supset": "⋑",
    "langle": "⟨",
    "ominus": "⊖",
    "rfloor": "⌋",
    "circeq": "≗",
    "eqcirc": "≖",
    "drcrop": "⌌",
    "veebar": "⊻",
    "ulcrop": "⌏",
    "nvDash": "⊭",
    "urcrop": "⌎",
    "exists": "∃",
    "approx": "≈",
    "dagger": "†",
    "boxdot": "⊡",
    "succeq": "≽",
    "bowtie": "⋈",
    "subset": "⊂",
    "notin": "∉",
    "Sigma": "Σ",
    "Omega": "Ω",
    "nabla": "∇",
    "colon": ":",
    "boxHu": "╧",
    "boxHd": "╤",
    "aleph": "ℵ",
    "gnsim": "⋧",
    "boxHU": "╩",
    "boxHD": "╦",
    "equiv": "≡",
    "lneqq": "≨",
    "alpha": "α",
    "amalg": "∐",
    "boxhU": "╨",
    "boxhD": "╥",
    "uplus": "⊎",
    "boxhu": "┴",
    "kappa": "κ",
    "sigma": "σ",
    "boxDL": "╗",
    "Theta": "Θ",
    "Vdash": "⊩",
    "boxDR": "╔",
    "boxDl": "╖",
    "sqcap": "⊓",
    "boxDr": "╓",
    "bar{}": "¯",
    "dashv": "⊣",
    "vDash": "⊨",
    "boxdl": "┐",
    "boxVl": "╢",
    "boxVh": "╫",
    "boxVr": "╟",
    "boxdr": "┌",
    "boxdL": "╕",
    "boxVL": "╣",
    "boxVH": "╬",
    "boxVR": "╠",
    "boxdR": "╒",
    "theta": "θ",
    "lhblk": "▄",
    "uhblk": "▀",
    "ldotp": ".",
    "ldots": "…",
    "boxvL": "╡",
    "boxvH": "╪",
    "boxvR": "╞",
    "boxvl": "┤",
    "boxvh": "┼",
    "boxvr": "├",
    "Delta": "Δ",
    "boxUR": "╚",
    "boxUL": "╝",
    "oplus": "⊕",
    "boxUr": "╙",
    "boxUl": "╜",
    "doteq": "≐",
    "happy": "㋡",
    "varpi": "ϖ",
    "smile": "☺",
    "boxul": "┘",
    "simeq": "≃",
    "boxuR": "╘",
    "boxuL": "╛",
    "boxhd": "┬",
    "gimel": "ℷ",
    "Gamma": "Γ",
    "lnsim": "⋦",
    "sqcup": "⊔",
    "omega": "ω",
    "sharp": "♯",
    "times": "×",
    "block": "█",
    "hat{}": "^",
    "wedge": "∧",
    "vdash": "⊢",
    "angle": "∠",
    "infty": "∞",
    "gamma": "γ",
    "asymp": "≍",
    "rceil": "⌉",
    "dot{}": "˙",
    "lceil": "⌈",
    "delta": "δ",
    "gneqq": "≩",
    "frown": "⌢",
    "phone": "☎",
    "vdots": "⋮",
    "boxr": "└",
    "k{i}": "į",
    "`{I}": "Ì",
    "perp": "⊥",
    "\"{o}": "ö",
    "={I}": "Ī",
    "`{a}": "à",
    "v{T}": "Ť",
    "surd": "√",
    "H{O}": "Ő",
    "vert": "|",
    "k{I}": "Į",
    "\"{y}": "ÿ",
    "\"{O}": "Ö",
    "u{u}": "ў",
    "u{G}": "Ğ",
    ".{E}": "Ė",
    ".{z}": "ż",
    "v{t}": "ť",
    "prec": "≺",
    "H{o}": "ő",
    "mldr": "…",
    "cong": "≅",
    ".{e}": "ė",
    "star": "*",
    ".{Z}": "Ż",
    "geqq": "≧",
    "cdot": "⋅",
    "cdots": "…",
    "`{U}": "Ù",
    "v{L}": "Ľ",
    "c{s}": "ş",
    "~{A}": "Ã",
    "Vert": "‖",
    "k{e}": "ę",
    "lnot": "¬",
    "leqq": "≦",
    "beta": "β",
    "beth": "ℶ",
    "~{n}": "ñ",
    "u{i}": "й",
    "c{S}": "Ş",
    "c{N}": "Ņ",
    "H{u}": "ű",
    "v{n}": "ň",
    "={U}": "Ū",
    "~{O}": "Õ",
    "v{E}": "Ě",
    "H{U}": "Ű",
    "v{N}": "Ň",
    "prod": "∏",
    "v{s}": "š",
    "\"{U}": "Ü",
    "c{n}": "ņ",
    "k{U}": "Ų",
    "c{R}": "Ŗ",
    "~{o}": "õ",
    "v{e}": "ě",
    "v{S}": "Š",
    "u{A}": "Ă",
    "circ": "∘",
    "\"{u}": "ü",
    "flat": "♭",
    "v{z}": "ž",
    "r{U}": "Ů",
    "`{O}": "Ò",
    "={u}": "ū",
    "oint": "∮",
    "c{K}": "Ķ",
    "k{u}": "ų",
    "not<": "≮",
    "not>": "≯",
    "`{o}": "ò",
    "\"{I}": "Ï",
    "v{D}": "Ď",
    ".{G}": "Ġ",
    "r{u}": "ů",
    "not=": "≠",
    "`{u}": "ù",
    "v{c}": "č",
    "c{k}": "ķ",
    ".{g}": "ġ",
    "odot": "⊙",
    "`{e}": "э",
    "c{T}": "Ţ",
    "v{d}": "ď",
    "\"{e}": "ё",
    "v{R}": "Ř",
    "k{a}": "ą",
    "nldr": "‥",
    "`{A}": "À",
    "~{N}": "Ñ",
    "nmid": "∤",
    ".{C}": "Ċ",
    "zeta": "ζ",
    "~{u}": "ũ",
    "`{E}": "Э",
    "~{a}": "ã",
    "c{t}": "ţ",
    "={o}": "ō",
    "v{r}": "ř",
    "={A}": "Ā",
    ".{c}": "ċ",
    "~{U}": "Ũ",
    "k{A}": "Ą",
    "\"{a}": "ä",
    "u{U}": "Ў",
    "iota": "ι",
    "={O}": "Ō",
    "c{C}": "Ç",
    "gneq": "≩",
    "boxH": "═",
    "hbar": "ℏ",
    "\"{A}": "Ä",
    "boxv": "│",
    "boxh": "─",
    "male": "♂",
    "sqrt": "√",
    "succ": "≻",
    "c{c}": "ç",
    "v{l}": "ľ",
    "u{a}": "ă",
    "v{Z}": "Ž",
    "c{G}": "Ģ",
    "v{C}": "Č",
    "lneq": "≨",
    "{E}": "Ё",
    "={a}": "ā",
    "c{l}": "ļ",
    "={E}": "Ē",
    "boxV": "║",
    "u{g}": "ğ",
    "u{I}": "Й",
    "c{L}": "Ļ",
    "k{E}": "Ę",
    ".{I}": "İ",
    "~{I}": "Ĩ",
    "c{r}": "ŗ",
    "{Y}": "Ÿ",
    "={e}": "ē",
    "leq": "≤",
    "Cup": "⋓",
    "Psi": "Ψ",
    "neq": "≠",
    "k{}": "˛",
    "={}": "‾",
    "H{}": "˝",
    "cup": "∪",
    "geq": "≥",
    "mho": "℧",
    "Dzh": "Џ",
    "cap": "∩",
    "bot": "⊥",
    "psi": "ψ",
    "chi": "χ",
    "c{}": "¸",
    "Phi": "Φ",
    "ast": "*",
    "ell": "ℓ",
    "top": "⊤",
    "lll": "⋘",
    "tau": "τ",
    "Cap": "⋒",
    "sad": "☹",
    "iff": "⇔",
    "eta": "η",
    "eth": "ð",
    "d{": "	̣",
    "rho": "ρ",
    "dzh": "џ",
    "div": "÷",
    "phi": "ϕ",
    "Rsh": "↱",
    "vee": "∨",
    "b{}": "ˍ",
    "t{": "	͡",
    "int": "∫",
    "sim": "∼",
    "r{}": "˚",
    "Lsh": "↰",
    "yen": "¥",
    "ggg": "⋙",
    "mid": "∣",
    "sum": "∑",
    "neg": "¬",
    "Dz": "Ѕ",
    "Re": "ℜ",
    "oe": "œ",
    "DH": "Ð",
    "ll": "≪",
    "ng": "ŋ",
    "wr": "≀",
    "wp": "℘",
    "=I": "І",
    ":)": "☺",
    ":(": "☹",
    "AE": "Æ",
    "AA": "Å",
    "ss": "ß",
    "dz": "ѕ",
    "ae": "æ",
    "aa": "å",
    "th": "þ",
    "to": "→",
    "Pi": "Π",
    "mp": "∓",
    "Im": "ℑ",
    "pm": "±",
    "pi": "π",
    "\"I": "Ї",
    "in": "∈",
    "ni": "∋",
    "ne": "≠",
    "TH": "Þ",
    "Xi": "Ξ",
    "nu": "ν",
    "NG": "Ŋ",
    ":G": "㋡",
    "xi": "ξ",
    "OE": "Œ",
    "gg": "≫",
    "DJ": "Đ",
    "=e": "є",
    "=E": "Є",
    "mu": "μ",
    "dj": "đ",
    // "&" : "&",
    // "$" : "$",
    // "%" : "%",
    // "#" : "#",
    // "-" : "­",
    "S": "§",
    "P": "¶",
    "O": "Ø",
    "L": "Ł",
    // "}" : "}",
    "o": "ø",
    "l": "ł",
    "h": "ℎ",
    "i": "ℹ",
    // "-" : "−",
    "'{Y}": "Ý",
    "'{y}": "ý",
    "'{L}": "Ĺ",
    "'{e}": "é",
    "'{l}": "ĺ",
    "'{s}": "ś",
    "'{z}": "ź",
    "'{E}": "É",
    "'{S}": "Ś",
    "'{Z}": "Ź",
    "'{R}": "Ŕ",
    "'{A}": "Á",
    "'{N}": "Ń",
    "'{I}": "Í",
    "'{n}": "ń",
    "'{c}": "ć",
    "'{u}": "ú",
    "'{C}": "Ć",
    "'{o}": "ó",
    "'{a}": "á",
    "'{O}": "Ó",
    "'{g}": "ǵ",
    "'{r}": "ŕ",
    "'{U}": "Ú",
    "'G": "Ѓ",
    "'C": "Ћ",
    "'K": "Ќ",
    "'k": "ќ",
    "'c": "ћ",
    "'g": "ѓ",
};
function str_latex_to_unicode(str) {
    str = str;
    for (let key in latex_greek) {
        str = str.replaceAll(key, latex_greek[key]);
    }
    for (let key in latex_symbols) {
        str = str.replaceAll('\\' + key, latex_symbols[key]);
    }
    return str;
}
function str_to_mathematical_italic(str) {
    return [...str_latex_to_unicode(str)]
        .map(c => unicode_mathematical_italic[c] || c).join('');
}

// TODO : add guard for the dictionary key
// since the implementation is using `for (let stylename in style)` without checking
// if the correct key is in the dictionary, it can lead to unintended behavior
// for example, `font-size` could be defined in default_text_diagram_style
// and will shadow the `font-size` in default_diagram_style
const default_diagram_style = {
    "fill": "none",
    "stroke": "black",
    "stroke-width": "1",
    "stroke-linecap": "butt",
    "stroke-dasharray": "none",
    "stroke-linejoin": "round",
    "vector-effect": "non-scaling-stroke",
    "opacity": "1",
};
const _init_default_diagram_style = Object.assign({}, default_diagram_style);
const default_text_diagram_style = {
    "fill": "black",
    "stroke": "none",
    "stroke-width": "1",
    "stroke-linecap": "butt",
    "stroke-dasharray": "none",
    "stroke-linejoin": "round",
    "vector-effect": "non-scaling-stroke",
    "opacity": "1",
};
const _init_default_text_diagram_style = Object.assign({}, default_text_diagram_style);
const default_textdata = {
    "text": "",
    "font-family": "Latin Modern Math, sans-serif",
    "font-size": DEFAULT_FONTSIZE,
    "font-weight": "normal",
    "text-anchor": "middle",
    "dy": "0.25em",
    "angle": "0",
    "font-style": "normal",
    "font-scale": "auto",
};
const _init_default_textdata = Object.assign({}, default_textdata);
function reset_default_styles() {
    for (let s in default_diagram_style)
        default_diagram_style[s] = _init_default_diagram_style[s];
    for (let s in default_text_diagram_style)
        default_text_diagram_style[s] = _init_default_text_diagram_style[s];
    for (let s in default_textdata)
        default_textdata[s] = _init_default_textdata[s];
}
function draw_polygon(svgelement, diagram, svgtag) {
    // get properties
    let style = Object.assign(Object.assign({}, default_diagram_style), diagram.style); // use default if not defined
    style.fill = get_color(style.fill, tab_color);
    style.stroke = get_color(style.stroke, tab_color);
    // draw svg
    let polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    for (let stylename in style) {
        polygon.style[stylename] = style[stylename];
    }
    if (svgtag != undefined)
        polygon.setAttribute("_dg_tag", svgtag);
    // polygon.style.fill = color_fill;
    // polygon.style.stroke = color_stroke;
    // use tab_color color palette
    svgelement.appendChild(polygon);
    if (diagram.path != undefined) {
        for (let i = 0; i < diagram.path.points.length; i++) {
            let p = diagram.path.points[i];
            var point = svgelement.createSVGPoint();
            point.x = p.x;
            point.y = -p.y;
            polygon.points.appendItem(point);
        }
    }
}
function draw_curve(svgelement, diagram, svgtag) {
    // get properties
    let style = Object.assign(Object.assign({}, default_diagram_style), diagram.style); // use default if not defined
    style.fill = "none";
    style.stroke = get_color(style.stroke, tab_color);
    // draw svg
    let polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    for (let stylename in style) {
        polyline.style[stylename] = style[stylename];
    }
    if (svgtag != undefined)
        polyline.setAttribute("_dg_tag", svgtag);
    svgelement.appendChild(polyline);
    if (diagram.path != undefined) {
        for (let i = 0; i < diagram.path.points.length; i++) {
            let p = diagram.path.points[i];
            var point = svgelement.createSVGPoint();
            point.x = p.x;
            point.y = -p.y;
            polyline.points.appendItem(point);
        }
    }
}
function is_dataURL(url) {
    // Regular expression to check for data URL
    const dataUrlPattern = /^data:image\/(png|jpeg|jpg|gif|svg\+xml);base64,/;
    return dataUrlPattern.test(url);
}
const _IMAGE_DATAURL_CACHE_MAP = new Map();
/**
 * Convert image href to data url
 * This is necessary so that the image diagram can be downloaded as png
 */
function set_image_href_dataURL(img, src) {
    // if it is already a dataURL, just set it
    if (is_dataURL(src)) {
        img.setAttribute("href", src);
        img.setAttribute("xlink:href", src);
        return;
    }
    // if it's already cached, just set it
    if (_IMAGE_DATAURL_CACHE_MAP.has(src)) {
        const dataURL = _IMAGE_DATAURL_CACHE_MAP.get(src);
        if (!dataURL)
            return;
        // dataURL can be undefined, indicating it's still loading or
        // the image is not found
        img.setAttribute("href", dataURL);
        img.setAttribute("xlink:href", dataURL);
        return;
    }
    _IMAGE_DATAURL_CACHE_MAP.set(src, undefined);
    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext('2d');
    let base_image = new Image();
    base_image.crossOrigin = "anonymous";
    base_image.onload = () => {
        canvas.height = base_image.height;
        canvas.width = base_image.width;
        ctx === null || ctx === void 0 ? void 0 : ctx.drawImage(base_image, 0, 0);
        // NOTE : we need to set both href and xlink:href for compatibility reason
        // most browser already deprecate xlink:href because of SVG 2.0
        // but other browser and image viewer/editor still only support xlink:href
        // might be removed in the future
        const dataURL = canvas.toDataURL("image/png");
        img.setAttribute("href", dataURL);
        img.setAttribute("xlink:href", dataURL);
        _IMAGE_DATAURL_CACHE_MAP.set(src, dataURL);
        canvas.remove();
    };
    base_image.src = src;
}
function draw_image(svgelement, diagram, svgtag) {
    let image = document.createElementNS("http://www.w3.org/2000/svg", "image");
    image.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
    if (diagram.imgdata.src == undefined)
        return;
    // make sure path is defined and have 4 points
    if (diagram.path == undefined)
        return;
    if (diagram.path.points.length != 4)
        return;
    // path: bottom-left, bottom-right, top-right, top-left
    // width  : 0-1
    // height : 1-2
    let width = diagram.path.points[1].sub(diagram.path.points[0]).length();
    let height = diagram.path.points[2].sub(diagram.path.points[1]).length();
    // calculate the linear transformation matrix
    // [ a c ]
    // [ b d ]
    let ex = diagram.path.points[1].sub(diagram.path.points[0]).normalize();
    let ey = diagram.path.points[3].sub(diagram.path.points[0]).normalize();
    let a = ex.x;
    let b = -ex.y;
    let c = -ey.x;
    let d = ey.y;
    let xpos = diagram.path.points[3].x;
    let ypos = -diagram.path.points[3].y;
    set_image_href_dataURL(image, diagram.imgdata.src);
    image.setAttribute("width", width.toString());
    image.setAttribute("height", height.toString());
    image.setAttribute("transform", `matrix(${a} ${b} ${c} ${d} ${xpos} ${ypos})`);
    image.setAttribute("preserveAspectRatio", "none");
    if (svgtag != undefined)
        image.setAttribute("_dg_tag", svgtag);
    svgelement.appendChild(image);
}
/**
 * Collect all DiagramType.Text in the diagram
 * @param diagram the outer diagram
 * @returns a list of DiagramType.Text
*/
function collect_text(diagram, type) {
    if (diagram.type == type) {
        return [diagram];
    }
    else if (diagram.type == DiagramType.Diagram) {
        let result = [];
        for (let d of diagram.children) {
            result = result.concat(collect_text(d, type));
        }
        return result;
    }
    else {
        return [];
    }
}
/** Calculate the scaling factor for the text based on the reference svg element */
function calculate_text_scale(referencesvgelement, padding) {
    const pad = expand_directional_value(padding !== null && padding !== void 0 ? padding : 0);
    let bbox = referencesvgelement.getBBox();
    let refsvgelement_width = referencesvgelement.width.baseVal.value - pad[1] - pad[3];
    let refsvgelement_height = referencesvgelement.height.baseVal.value - pad[0] - pad[2];
    return Math.max(bbox.width / refsvgelement_width, bbox.height / refsvgelement_height);
}
/**
 * @param svgelement the svg element to draw to
 * @param diagrams the list of text diagrams to draw
 * @param calculated_scale the calculated scale for the text
 */
function draw_texts(svgelement, diagrams, calculated_scale, svgtag) {
    for (let diagram of diagrams) {
        let style = Object.assign(Object.assign({}, default_text_diagram_style), diagram.style); // use default if not defined
        style.fill = get_color(style.fill, tab_color);
        style.stroke = get_color(style.stroke, tab_color);
        let textdata = Object.assign(Object.assign({}, default_textdata), diagram.textdata); // use default if not defined
        if (diagram.path == undefined) {
            throw new Error("Text must have a path");
        }
        // draw svg of text
        let text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        // text.setAttribute("x", diagram.path.points[0].x.toString());
        // text.setAttribute("y", (-diagram.path.points[0].y).toString());
        let xpos = diagram.path.points[0].x;
        let ypos = -diagram.path.points[0].y;
        let angle_deg = to_degree(parseFloat(textdata["angle"]));
        let scale = textdata["font-scale"] == "auto" ?
            calculated_scale : parseFloat(textdata["font-scale"]);
        let font_size = parseFloat(textdata["font-size"]) * scale;
        // set font styles (font-family, font-size, font-weight)
        text.setAttribute("font-family", textdata["font-family"]);
        text.setAttribute("font-style", textdata["font-style"]);
        text.setAttribute("font-size", font_size.toString());
        text.setAttribute("font-weight", textdata["font-weight"]);
        text.setAttribute("text-anchor", textdata["text-anchor"]);
        text.setAttribute("dy", textdata["dy"]);
        // text.setAttribute("dominant-baseline", textdata["dominant-baseline"] as string);
        text.setAttribute("transform", `translate(${xpos} ${ypos}) rotate(${angle_deg}) `);
        if (svgtag != undefined)
            text.setAttribute("_dg_tag", svgtag);
        // custom attribute for tex display
        text.setAttribute("_x", xpos.toString());
        text.setAttribute("_y", ypos.toString());
        text.setAttribute("_angle", angle_deg.toString());
        for (let stylename in style) {
            text.style[stylename] = style[stylename];
        }
        // set the content of the text
        let text_content = textdata["text"];
        if (diagram.tags.includes(TAG.TEXTVAR) && !is_texstr(text_content))
            text_content = str_to_mathematical_italic(text_content);
        text.innerHTML = text_content;
        // add to svgelement
        svgelement.appendChild(text);
    }
}
/**
 * @param svgelement the svg element to draw to
 * @param diagrams the list of text diagrams to draw
 * @param calculated_scale the calculated scale for the text
 */
function draw_multiline_texts(svgelement, diagrams, calculated_scale, svgtag) {
    var _a, _b, _c, _d;
    for (let diagram of diagrams) {
        //     let style = {...default_text_diagram_style, ...diagram.style}; // use default if not defined
        //     style.fill = get_color(style.fill as string, tab_color);
        //     style.stroke = get_color(style.stroke as string, tab_color);
        //
        //     let textdata = {...default_textdata, ...diagram.textdata}; // use default if not defined
        if (diagram.path == undefined) {
            throw new Error("Text must have a path");
        }
        // draw svg of text
        let textsvg = document.createElementNS("http://www.w3.org/2000/svg", "text");
        let xpos = diagram.path.points[0].x;
        let ypos = -diagram.path.points[0].y;
        // let angle_deg = to_degree(parseFloat(textdata["angle"] as string));
        let angle_deg = 0;
        // use default if not defined
        let textdata = Object.assign(Object.assign(Object.assign({}, default_textdata), { dy: "0", "text-anchor": "start" }), diagram.textdata);
        let diagram_font_size = textdata["font-size"];
        if (((_a = diagram.multilinedata) === null || _a === void 0 ? void 0 : _a.content) == undefined) {
            throw new Error("MultilineText must have multilinedata");
        }
        // let current_line : number = 0;
        let dg_scale_factor = (_b = diagram.multilinedata["scale-factor"]) !== null && _b !== void 0 ? _b : 1;
        let is_firstline = true;
        let is_in_front = true;
        let newline_dy = "1em";
        for (let tspandata of diagram.multilinedata.content) {
            if (tspandata.text == "\n") {
                is_in_front = true;
                newline_dy = (_c = tspandata.style['dy']) !== null && _c !== void 0 ? _c : "1em";
                continue;
            }
            // create tspan for each tspandata
            let tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
            let not_setting_dy = (tspandata.style['dy'] == undefined);
            let tspanstyle = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, default_text_diagram_style), textdata), { dy: "0", dx: "0" }), { "font-size": diagram_font_size }), tspandata.style);
            if (is_in_front) {
                tspan.setAttribute("x", "0");
                let textdata_dy = (_d = textdata["dy"]) !== null && _d !== void 0 ? _d : "0";
                if (not_setting_dy)
                    tspanstyle.dy = is_firstline ? textdata_dy : newline_dy;
                is_in_front = false;
            }
            let scale = tspanstyle["font-scale"] == "auto" ?
                calculated_scale : parseFloat(tspanstyle["font-scale"]);
            let font_size = parseFloat(tspanstyle["font-size"]) * scale * dg_scale_factor;
            if (tspanstyle["tag"])
                tspan.setAttribute("_dg_tag", tspanstyle["tag"]);
            tspan.setAttribute("dx", tspanstyle.dx);
            tspan.setAttribute("dy", tspanstyle.dy);
            tspan.setAttribute("font-style", tspanstyle["font-style"]);
            tspan.setAttribute("font-family", tspanstyle["font-family"]);
            // tspan.setAttribute("font-size", tspanstyle["font-size"] as string);
            tspan.setAttribute("font-size", font_size.toString());
            tspan.setAttribute("font-weight", tspanstyle["font-weight"]);
            // tspan.setAttribute("text-anchor", tspanstyle["text-anchor"] as string);
            tspan.style["fill"] = get_color(tspanstyle.fill, tab_color);
            tspan.style["stroke"] = get_color(tspanstyle.stroke, tab_color);
            tspan.style["opacity"] = tspanstyle.opacity;
            let text = tspandata.text;
            if (tspanstyle["textvar"])
                text = str_to_mathematical_italic(text);
            tspan.innerHTML = text;
            textsvg.appendChild(tspan);
            is_firstline = false;
        }
        //
        // let scale = textdata["font-scale"] == "auto" ? 
        //     calculated_scale : parseFloat(textdata["font-scale"] as string);
        // let font_size = parseFloat(textdata["font-size"] as string) * scale;
        //
        // // set font styles (font-family, font-size, font-weight)
        // text.setAttribute("font-family", textdata["font-family"] as string);
        // text.setAttribute("font-size", font_size.toString());
        // text.setAttribute("font-weight", textdata["font-weight"] as string);
        // text.setAttribute("text-anchor", textdata["text-anchor"] as string);
        // // text.setAttribute("dominant-baseline", textdata["dominant-baseline"] as string);
        textsvg.setAttribute("dy", textdata["dy"]);
        textsvg.setAttribute("text-anchor", textdata["text-anchor"]);
        textsvg.setAttribute("transform", `translate(${xpos} ${ypos}) rotate(${angle_deg}) `);
        if (svgtag != undefined)
            textsvg.setAttribute("_dg_tag", svgtag);
        //
        // // custom attribute for tex display
        // text.setAttribute("_x", xpos.toString());
        // text.setAttribute("_y", ypos.toString());
        // text.setAttribute("_angle", angle_deg.toString());
        // 
        // for (let stylename in style) {
        //     text.style[stylename as any] = (style as any)[stylename as any];
        // }
        //
        // // set the content of the text
        // let text_content = textdata["text"];
        // if (diagram.tags.includes('textvar') && !is_texstr(text_content)) 
        //     text_content = str_to_mathematical_italic(text_content);
        // text.innerHTML = text_content;
        //
        // // add to svgelement
        svgelement.appendChild(textsvg);
    }
}
/**
 * Get all svg elements with a specific tag
 * @param svgelement the svg element to search
 * @param tag the tag to search
 * @returns a list of svg elements with the tag
 */
function get_tagged_svg_element(tag, svgelement) {
    var _a;
    let result = [];
    for (let i in svgelement.children) {
        let child = svgelement.children[i];
        if (!(child instanceof SVGElement))
            continue;
        if (child.getAttribute("_dg_tag") == tag) {
            result.push(child);
        }
        // recurse through all children
        if ((_a = child.children) === null || _a === void 0 ? void 0 : _a.length) {
            result = result.concat(get_tagged_svg_element(tag, child));
        }
    }
    return result;
}
/**
 * @param svgelement the svg element to draw to
 * @param diagram the diagram to draw
 * @param render_text whether to render text
 * @param text_scaling_factor (optional) the scaling factor for text
 * @param svgtag (optional) the tag to add to the svg element
 */
function f_draw_to_svg(svgelement, diagram, render_text = true, text_scaling_factor, svgtag) {
    if (diagram.type == DiagramType.Polygon) {
        draw_polygon(svgelement, diagram, svgtag);
    }
    else if (diagram.type == DiagramType.Curve) {
        draw_curve(svgelement, diagram, svgtag);
    }
    else if (diagram.type == DiagramType.Text || diagram.type == DiagramType.MultilineText) ;
    else if (diagram.type == DiagramType.Image) {
        draw_image(svgelement, diagram, svgtag);
    }
    else if (diagram.type == DiagramType.Diagram) {
        for (let d of diagram.children) {
            f_draw_to_svg(svgelement, d, false, undefined, svgtag);
        }
    }
    else {
        console.warn("Unreachable, unknown diagram type : " + diagram.type);
    }
    // draw text last to make the scaling works
    // because the text is scaled based on the bounding box of the svgelement
    if (render_text) {
        if (text_scaling_factor == undefined) {
            text_scaling_factor = calculate_text_scale(svgelement);
        }
        let text_diagrams = collect_text(diagram, DiagramType.Text);
        let multiline_diagrams = collect_text(diagram, DiagramType.MultilineText);
        draw_texts(svgelement, text_diagrams, text_scaling_factor !== null && text_scaling_factor !== void 0 ? text_scaling_factor : 1, svgtag);
        draw_multiline_texts(svgelement, multiline_diagrams, text_scaling_factor !== null && text_scaling_factor !== void 0 ? text_scaling_factor : 1, svgtag);
    }
}
/**
 * WARNING: DEPRECATED
 * use `draw_to_svg_element` instead
 *
 * Draw a diagram to an svg element
 * @param outer_svgelement the outer svg element to draw to
 * @param diagram the diagram to draw
 * @param set_html_attribute whether to set the html attribute of the outer_svgelement
 * @param render_text whether to render text
 * @param clear_svg whether to clear the svg before drawing
 */
function draw_to_svg(outer_svgelement, diagram, set_html_attribute = true, render_text = true, clear_svg = true) {
    let options = {
        set_html_attribute: set_html_attribute,
        render_text: render_text,
        clear_svg: clear_svg,
    };
    draw_to_svg_element(outer_svgelement, diagram, options);
}
// TODO: replace draw_to_svg with the current draw_to_svg_element in the next major version
/**
 * Draw a diagram to an svg element
 * @param outer_svgelement the outer svg element to draw to
 * @param diagram the diagram to draw
 * @param options the options for drawing
 * ```typescript
 * options : {
 *    set_html_attribute? : boolean (true),
 *    render_text? : boolean (true),
 *    clear_svg? : boolean (true),
 *    background_color? : string (undefined),
 *    padding? : number | number[] (10),
 *    text_scaling_reference_svg? : SVGSVGElement (undefined),
 *    text_scaling_reference_padding? : number | number[] (undefined),
 * }
 * ````
 * define `text_scaling_reference_svg` and `text_scaling_reference_padding` to scale text based on another svg element
 */
function draw_to_svg_element(outer_svgelement, diagram, options = {}) {
    var _a, _b, _c, _d, _e, _f;
    const set_html_attribute = (_a = options.set_html_attribute) !== null && _a !== void 0 ? _a : true;
    const render_text = (_b = options.render_text) !== null && _b !== void 0 ? _b : true;
    const clear_svg = (_c = options.clear_svg) !== null && _c !== void 0 ? _c : true;
    let svgelement = undefined;
    // check if outer_svgelement has a child with meta=diagram_svg
    for (let i in outer_svgelement.children) {
        let child = outer_svgelement.children[i];
        if (child instanceof SVGSVGElement && child.getAttribute("meta") == "diagram_svg") {
            svgelement = child;
            break;
        }
    }
    if (svgelement == undefined) {
        // if svgelemet doesn't exist yet, create it
        // create an inner svg element
        svgelement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svgelement.setAttribute("meta", "diagram_svg");
        svgelement.setAttribute("width", "100%");
        svgelement.setAttribute("height", "100%");
        outer_svgelement.appendChild(svgelement);
    }
    let text_scaling_factor = undefined;
    if (options.text_scaling_reference_svg) {
        options.text_scaling_reference_padding = (_e = (_d = options.text_scaling_reference_padding) !== null && _d !== void 0 ? _d : options.padding) !== null && _e !== void 0 ? _e : 10;
        options.text_scaling_reference_padding = expand_directional_value(options.text_scaling_reference_padding);
        text_scaling_factor = calculate_text_scale(options.text_scaling_reference_svg, options.text_scaling_reference_padding);
    }
    // TODO : for performance, do smart clearing of svg, and not just clear everything
    if (clear_svg)
        svgelement.innerHTML = "";
    f_draw_to_svg(svgelement, diagram, render_text, text_scaling_factor);
    if (set_html_attribute) {
        const pad_px = expand_directional_value((_f = options.padding) !== null && _f !== void 0 ? _f : 10);
        // set viewbox to the bounding box
        let bbox = svgelement.getBBox();
        // add padding of 10px to the bounding box (if the graph is small, it'll mess it up)
        // scale 10px based on the width and height of the svg
        let svg_width = svgelement.width.baseVal.value - pad_px[1] - pad_px[3];
        let svg_height = svgelement.height.baseVal.value - pad_px[0] - pad_px[2];
        let scale = Math.max(bbox.width / svg_width, bbox.height / svg_height);
        let pad = pad_px.map(p => p * scale);
        // [top, right, bottom, left]
        bbox.x -= pad[3];
        bbox.y -= pad[0];
        bbox.width += pad[1] + pad[3];
        bbox.height += pad[0] + pad[2];
        svgelement.setAttribute("viewBox", `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
        // set preserveAspectRatio to xMidYMid meet
        svgelement.setAttribute("preserveAspectRatio", "xMidYMid meet");
    }
    if (options.background_color) {
        let bbox = svgelement.getBBox();
        // if svgelement has viewBox set, use it instead of getBBox
        if (svgelement.viewBox.baseVal.width !== 0)
            bbox = svgelement.viewBox.baseVal;
        // draw a rectangle as the background
        let rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", bbox.x.toString());
        rect.setAttribute("y", bbox.y.toString());
        rect.setAttribute("width", bbox.width.toString());
        rect.setAttribute("height", bbox.height.toString());
        rect.style.fill = get_color(options.background_color, tab_color);
        rect.style.stroke = "none";
        // prepend
        svgelement.insertBefore(rect, svgelement.firstChild);
    }
}
/* @return [top, right, bottom, left] */
function expand_directional_value(padding) {
    let p = padding;
    if (typeof p === 'number')
        return [p, p, p, p];
    if (!Array.isArray(p))
        return [0, 0, 0, 0];
    if (p.length === 1)
        return [p[0], p[0], p[0], p[0]];
    if (p.length === 2)
        return [p[0], p[1], p[0], p[1]];
    if (p.length === 3)
        return [p[0], p[1], p[2], p[1]];
    if (p.length >= 4)
        return [p[0], p[1], p[2], p[3]];
    return [0, 0, 0, 0];
}
function is_texstr(s) {
    return s.startsWith("$") && s.endsWith("$");
}
function is_texdisplaystr(s) {
    return s.startsWith("$$") && s.endsWith("$$");
}
function strip_texstr(s) {
    if (is_texdisplaystr(s))
        return s.substring(2, s.length - 2);
    if (is_texstr(s))
        return s.substring(1, s.length - 1);
    return s;
}
/**
 * Recursively handle tex in svg
 * @param svg the svg element to handle
 * @param texhandler the tex handler function
 */
function handle_tex_in_svg(svg, texhandler) {
    // recurse through all children of svg until we find text
    // then replace the text with the svg returned by texhandler
    for (let i = 0; i < svg.children.length; i++) {
        let child = svg.children[i];
        if (child instanceof SVGTextElement) {
            let str = child.innerHTML;
            if (!is_texstr(str))
                continue;
            let fontsizestr = child.getAttribute('font-size');
            if (fontsizestr == null)
                continue;
            let fontsize = parseFloat(fontsizestr);
            let svgstr = texhandler(strip_texstr(str), {
                display: is_texdisplaystr(str),
                // fontsize : parseFloat(fontsize),
            });
            let xstr = child.getAttribute('_x');
            let ystr = child.getAttribute('_y');
            // let angstr = child.getAttribute('_angle');
            if (xstr == null || ystr == null)
                continue;
            let textanchor = child.getAttribute('text-anchor');
            let dy = child.getAttribute('dy');
            if (textanchor == null || dy == null)
                continue;
            child.outerHTML = svgstr;
            child = svg.children[i]; // update child
            // HACK: scaling for mathjax tex2svg, for other option think about it later
            let widthexstr = child.getAttribute('width'); // ###ex
            if (widthexstr == null)
                continue;
            let widthex = parseFloat(widthexstr.substring(0, widthexstr.length - 2));
            let heightexstr = child.getAttribute('height'); // ###ex
            if (heightexstr == null)
                continue;
            let heightex = parseFloat(heightexstr.substring(0, heightexstr.length - 2));
            const magic_number = 2;
            let width = widthex * fontsize / magic_number;
            let height = heightex * fontsize / magic_number;
            let xval = parseFloat(xstr);
            let yval = parseFloat(ystr);
            switch (textanchor) {
                case "start": break; // left
                case "middle": // center
                    xval -= width / 2;
                    break;
                case "end": // right
                    xval -= width;
                    break;
            }
            switch (dy) {
                case "0.75em": break; // top
                case "0.25em": // center
                    yval -= height / 2;
                    break;
                case "-0.25em": // bottom
                    yval -= height;
                    break;
            }
            child.setAttribute('width', width.toString());
            child.setAttribute('height', height.toString());
            child.setAttribute('x', xval.toString());
            child.setAttribute('y', yval.toString());
        }
        else if (child instanceof SVGElement) {
            handle_tex_in_svg(child, texhandler);
        }
    }
}
/**
 * Download the svg as svg file
 * @param outer_svgelement the outer svg element to download
 */
function download_svg_as_svg(outer_svgelement) {
    let inner_svgelement = outer_svgelement.querySelector("svg[meta=diagram_svg]");
    if (inner_svgelement == null) {
        console.warn("Cannot find svg element");
        return;
    }
    let locator_svgelement = outer_svgelement.querySelector("svg[meta=control_svg]");
    let svgelement = inner_svgelement;
    // concat locator_svgelement to the copy of inner_svgelement
    if (locator_svgelement != null) {
        let copy_inner_svgelement = inner_svgelement.cloneNode(true);
        for (let i in locator_svgelement.children) {
            let child = locator_svgelement.children[i];
            if (!(child instanceof SVGSVGElement))
                continue;
            copy_inner_svgelement.appendChild(child.cloneNode(true));
        }
        svgelement = copy_inner_svgelement;
    }
    // get svg string
    let svg_string = new XMLSerializer().serializeToString(svgelement);
    let blob = new Blob([svg_string], { type: "image/svg+xml" });
    let url = URL.createObjectURL(blob);
    let a = document.createElement("a");
    a.href = url;
    a.download = "diagramatics.svg";
    a.click();
}
/**
 * Download the svg as png file
 * @param outer_svgelement the outer svg element to download
 */
function download_svg_as_png(outer_svgelement) {
    let inner_svgelement = outer_svgelement.querySelector("svg[meta=diagram_svg]");
    if (inner_svgelement == null) {
        console.warn("Cannot find svg element");
        return;
    }
    let svgelem = outer_svgelement;
    let svg_string = new XMLSerializer().serializeToString(svgelem);
    let svg_blob = new Blob([svg_string], { type: "image/svg+xml" });
    const DOMURL = window.URL || window.webkitURL || window;
    const url = DOMURL.createObjectURL(svg_blob);
    const image = new Image();
    image.width = svgelem.width.baseVal.value;
    image.height = svgelem.height.baseVal.value;
    image.src = url;
    image.onload = function () {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d");
        ctx === null || ctx === void 0 ? void 0 : ctx.drawImage(image, 0, 0);
        DOMURL.revokeObjectURL(url);
        const imgURI = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
        const a = document.createElement("a");
        a.href = imgURI;
        a.download = "diagramatics.png";
        a.click();
    };
}

// function helpers to create common shapes
/**
 * Create rectange centered at origin
 * @param width width of the rectangle
 * @param height height of the rectangle
 * @returns a Diagram object
 */
function rectangle(width, height) {
    let points = [
        V2$5(-width / 2, -height / 2), V2$5(width / 2, -height / 2),
        V2$5(width / 2, height / 2), V2$5(-width / 2, height / 2)
    ];
    return polygon(points);
}
/**
 * Create rectange with a given bottom left corner and top right corner
 * @param bottomleft bottom left corner of the rectangle
 * @param topright top right corner of the rectangle
 * @returns a Diagram object
 */
function rectangle_corner(bottomleft, topright) {
    let points = [
        bottomleft, V2$5(topright.x, bottomleft.y),
        topright, V2$5(bottomleft.x, topright.y),
    ];
    return polygon(points);
}
/**
 * Create square centered at origin
 * @param side side length of the square
 * @returns a Diagram object
 */
function square(side = 1) {
    return rectangle(side, side);
}
/**
 * Create regular polygon centered at origin with a given radius
 * @param n number of sides
 * @param radius radius of the polygon
 * @returns a Diagram object
 * \* if you want to create a regular polygon with a given side length, use regular_polygon_side
 */
function regular_polygon(n, radius = 1) {
    let points = [];
    for (let i = 0; i < n; i++) {
        points.push(V2$5(0, radius).rotate(i * 2 * Math.PI / n));
    }
    return polygon(points);
}
/**
 * Create regular polygon centered at origin with a given side length
 * @param n number of sides
 * @param sidelength side length of the polygon
 * @returns a Diagram object
 * \* if you want to create a regular polygon with a given radius, use regular_polygon
 */
function regular_polygon_side(n, sidelength = 1) {
    let radius = sidelength / (2 * Math.sin(Math.PI / n));
    return regular_polygon(n, radius);
}
/**
 * Create circle centered at origin
 * *currently implemented as a regular polygon with 50 sides*
 * @param radius radius of the circle
 * @returns a Diagram object
 */
function circle(radius = 1) {
    return regular_polygon(50, radius).append_tags(TAG.CIRCLE);
}
/**
 * Create an arc centered at origin
 * @param radius radius of the arc
 * @param angle angle of the arc
 * @returns a Diagram object
 */
function arc(radius = 1, angle = to_radian(360)) {
    let n = 100;
    let points = [];
    for (let i = 0; i < n; i++) {
        points.push(V2$5(radius, 0).rotate(i * angle / (n - 1)));
    }
    return curve(points);
}
/**
 * Create an arrow from origin to a given point
 * @param v the end point of the arrow
 * @param headsize size of the arrow head
 * @returns a Diagram object
 */
function arrow(v, headsize = 1) {
    let line_diagram = line$1(V2$5(0, 0), v).append_tags(TAG.ARROW_LINE);
    let raw_triangle = polygon([V2$5(0, 0), V2$5(-headsize, headsize / 2), V2$5(-headsize, -headsize / 2)]);
    let head_triangle = raw_triangle.rotate(v.angle()).position(v).append_tags(TAG.ARROW_HEAD);
    return diagram_combine(line_diagram, head_triangle);
}
/**
 * Create an arrow from a given point to another given point
 * @param start the start point of the arrow
 * @param end the end point of the arrow
 * @param headsize size of the arrow head
 * @returns a Diagram object
 */
function arrow1(start, end, headsize = 1) {
    return arrow(end.sub(start), headsize).position(start);
}
/**
 * Create a two-sided arrow from a given point to another given point
 * @param start the start point of the arrow
 * @param end the end point of the arrow
 * @param headsize size of the arrow head
 * @returns a Diagram object
 */
function arrow2(start, end, headsize = 1) {
    let line_diagram = line$1(start, end).append_tags(TAG.ARROW_LINE);
    let direction = end.sub(start);
    let raw_triangle = polygon([V2$5(0, 0), V2$5(-headsize, headsize / 2), V2$5(-headsize, -headsize / 2)]);
    let head_triangle = raw_triangle.rotate(direction.angle()).position(end).append_tags(TAG.ARROW_HEAD);
    let head_triangle2 = raw_triangle.rotate(direction.angle() + Math.PI).position(start).append_tags(TAG.ARROW_HEAD);
    return diagram_combine(line_diagram, head_triangle, head_triangle2);
}
/**
 * Create a text object with mathematical italic font
 * @param str text to be displayed
 * @returns a Diagram object
 */
function textvar(str) {
    return text(str).append_tags(TAG.TEXTVAR);
}

// ============================= utilities
/**
 * Get the radius of a circle
 * @param circle a circle Diagram
 * @returns radius of the circle
 */
function circle_radius(circle) {
    let tags = circle.tags;
    if (!tags.includes(TAG.CIRCLE))
        return -1;
    let center = circle.get_anchor('center-center');
    if (circle.path == undefined)
        return -1;
    let p0 = circle.path.points[0];
    return center.sub(p0).length();
}
/**
 * Get the tangent points of a circle from a point
 * @param point a point
 * @param circle a circle Diagram
 */
function circle_tangent_point_from_point(point, circle) {
    let radius = circle_radius(circle);
    if (radius == -1)
        return [V2$5(0, 0), V2$5(0, 0)];
    let center = circle.get_anchor('center-center');
    // https://en.wikipedia.org/wiki/Tangent_lines_to_circles
    let r = radius;
    let d0_2 = center.sub(point).length_sq();
    let r_2 = r * r;
    let v0 = point.sub(center);
    let sLeft = r_2 / d0_2;
    let vLeft = v0.scale(sLeft);
    let sRight = r * Math.sqrt(d0_2 - r_2) / d0_2;
    let vRight = V2$5(-v0.y, v0.x).scale(sRight);
    let P1 = vLeft.add(vRight).add(center);
    let P2 = vLeft.sub(vRight).add(center);
    return [P1, P2];
}
/**
 * Get the points of a line
 * @param l a line Diagram
 * @returns the two points of the line
 */
function line_points(l) {
    let tags = l.tags;
    if (!tags.includes(TAG.LINE))
        return [V2$5(0, 0), V2$5(0, 0)];
    if (l.path == undefined)
        return [V2$5(0, 0), V2$5(0, 0)];
    let p0 = l.path.points[0];
    let p1 = l.path.points[1];
    return [p0, p1];
}
/**
 * Get the intersection of a line with a horizontal line at y = yi
 * @param l a line Diagram
 * @param yi y value of the horizontal line
 * @returns the intersection point
 */
function line_intersection_y(l, yi) {
    let [a, b] = line_points(l);
    let xi = a.x + (b.x - a.x) * (yi - a.y) / (b.y - a.y);
    return V2$5(xi, yi);
}
/**
 * Get the intersection of a line with a vertical line at x = xi
 * @param l a line Diagram
 * @param xi x value of the vertical line
 * @returns the intersection point
 */
function line_intersection_x(l, xi) {
    let [a, b] = line_points(l);
    let yi = a.y + (b.y - a.y) * (xi - a.x) / (b.x - a.x);
    return V2$5(xi, yi);
}
/**
 * Get the intersection of two lines
 * @param l1 a line Diagram
 * @param l2 a line Diagram
 * @returns the intersection point
 * if the lines are parallel, return V2(Infinity, Infinity)
 */
function line_intersection$1(l1, l2) {
    if (!l1.tags.includes(TAG.LINE) || !l2.tags.includes(TAG.LINE))
        return V2$5(Infinity, Infinity);
    let [a1, b1] = line_points(l1);
    let [a2, b2] = line_points(l2);
    let x1 = a1.x;
    let y1 = a1.y;
    let x2 = b1.x;
    let y2 = b1.y;
    let x3 = a2.x;
    let y3 = a2.y;
    let x4 = b2.x;
    let y4 = b2.y;
    let d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (d == 0)
        return V2$5(Infinity, Infinity);
    let x = ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / d;
    let y = ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / d;
    return V2$5(x, y);
}
// ============================= shapes
/**
 * Extend a line by a length on both ends
 * @param l a line Diagram
 * @param len1 length to extend on the first end
 * @param len2 length to extend on the second end
 * @returns a new line Diagram
 */
function line_extend(l, len1, len2) {
    let tags = l.tags;
    if (!tags.includes(TAG.LINE))
        return l;
    if (l.path == undefined)
        return l;
    let p0 = l.path.points[0];
    let p1 = l.path.points[1];
    let v = p1.sub(p0).normalize();
    let p0_new = p0.sub(v.scale(len1));
    let p1_new = p1.add(v.scale(len2));
    let newl = l.copy();
    if (newl.path == undefined)
        return l; // to surpress typescript error
    newl.path.points = [p0_new, p1_new];
    return newl;
}
/**
 * Get the size of a diagram
 * @param diagram a diagram
 * @returns the width and height of the diagram
 */
function size(diagram) {
    let bb = diagram.bounding_box();
    return [bb[1].x - bb[0].x, bb[1].y - bb[0].y];
}

var shapes_geometry = /*#__PURE__*/Object.freeze({
    __proto__: null,
    circle_radius: circle_radius,
    circle_tangent_point_from_point: circle_tangent_point_from_point,
    line_extend: line_extend,
    line_intersection: line_intersection$1,
    line_intersection_x: line_intersection_x,
    line_intersection_y: line_intersection_y,
    line_points: line_points,
    size: size
});

/**
 * Align diagrams vertically
 * @param diagrams diagrams to be aligned
 * @param alignment vertical alignment of the diagrams
 * alignment can be 'top', 'center', or 'bottom'
 * @returns array of aligned diagrams
 */
function align_vertical(diagrams, alignment = 'center') {
    // align all the diagrams following the first diagram
    if (diagrams.length == 0) {
        return empty();
    }
    let newdiagrams = [...diagrams];
    if (alignment == 'top') {
        let top_y = newdiagrams[0].get_anchor("top-left").y;
        // return diagrams.map(d => d.translate(V2(0, top_y - d.get_anchor("top-left").y)));
        for (let i = 0; i < newdiagrams.length; i++) {
            newdiagrams[i] = newdiagrams[i].translate(V2$5(0, top_y - newdiagrams[i].get_anchor("top-left").y));
        }
        return diagram_combine(...newdiagrams);
    }
    else if (alignment == 'center') {
        let center_y = newdiagrams[0].get_anchor("center-left").y;
        // return diagrams.map(d => d.translate(V2(0, center_y - d.get_anchor("center-left").y)));
        for (let i = 0; i < newdiagrams.length; i++) {
            newdiagrams[i] = newdiagrams[i].translate(V2$5(0, center_y - newdiagrams[i].get_anchor("center-left").y));
        }
        return diagram_combine(...newdiagrams);
    }
    else if (alignment == 'bottom') {
        let bottom_y = newdiagrams[0].get_anchor("bottom-left").y;
        // return diagrams.map(d => d.translate(V2(0, bottom_y - d.get_anchor("bottom-left").y)));
        for (let i = 0; i < newdiagrams.length; i++) {
            newdiagrams[i] = newdiagrams[i].translate(V2$5(0, bottom_y - newdiagrams[i].get_anchor("bottom-left").y));
        }
        return diagram_combine(...newdiagrams);
    }
    else {
        throw new Error("Unknown vertical alignment : " + alignment);
    }
}
/**
 * Align diagrams horizontally
 * @param diagrams diagrams to be aligned
 * @param alignment horizontal alignment of the diagrams
 * alignment can be 'left', 'center', or 'right'
 * @returns array of aligned diagrams
 */
function align_horizontal(diagrams, alignment = 'center') {
    // align all the diagrams following the first diagram
    if (diagrams.length == 0) {
        return empty();
    }
    let newdiagrams = [...diagrams];
    if (alignment == 'left') {
        let left_x = newdiagrams[0].get_anchor("top-left").x;
        // return newdiagrams.map(d => d.translate(V2(left_x - d.get_anchor("top-left").x, 0)));
        for (let i = 0; i < newdiagrams.length; i++) {
            newdiagrams[i] = newdiagrams[i].translate(V2$5(left_x - newdiagrams[i].get_anchor("top-left").x, 0));
        }
        return diagram_combine(...newdiagrams);
    }
    else if (alignment == 'center') {
        let center_x = newdiagrams[0].get_anchor("top-center").x;
        // return newdiagrams.map(d => d.translate(V2(center_x - d.get_anchor("top-center").x, 0)));
        for (let i = 0; i < newdiagrams.length; i++) {
            newdiagrams[i] = newdiagrams[i].translate(V2$5(center_x - newdiagrams[i].get_anchor("top-center").x, 0));
        }
        return diagram_combine(...newdiagrams);
    }
    else if (alignment == 'right') {
        let right_x = newdiagrams[0].get_anchor("top-right").x;
        // return newdiagrams.map(d => d.translate(V2(right_x - d.get_anchor("top-right").x, 0)));
        for (let i = 0; i < newdiagrams.length; i++) {
            newdiagrams[i] = newdiagrams[i].translate(V2$5(right_x - newdiagrams[i].get_anchor("top-right").x, 0));
        }
        return diagram_combine(...newdiagrams);
    }
    else {
        throw new Error("Unknown horizontal alignment : " + alignment);
    }
}
/**
 * Distribute diagrams horizontally
 * @param diagrams diagrams to be distributed
 * @param space space between the diagrams (default = 0)
 * @returns array of distributed diagrams
 */
function distribute_horizontal(diagrams, space = 0) {
    if (diagrams.length == 0) {
        return empty();
    }
    let newdiagrams = [...diagrams];
    let distributed_diagrams = [newdiagrams[0]];
    for (let i = 1; i < newdiagrams.length; i++) {
        let prev_diagram = distributed_diagrams[i - 1];
        let this_diagram = newdiagrams[i];
        let prev_right = prev_diagram.get_anchor("top-right").x;
        let this_left = this_diagram.get_anchor("top-left").x;
        let dx = prev_right - this_left + space;
        distributed_diagrams.push(this_diagram.translate(V2$5(dx, 0)));
    }
    return diagram_combine(...distributed_diagrams);
}
/**
 * Distribute diagrams vertically
 * @param diagrams diagrams to be distributed
 * @param space space between the diagrams (default = 0)
 * @returns array of distributed diagrams
 */
function distribute_vertical(diagrams, space = 0) {
    if (diagrams.length == 0) {
        return empty();
    }
    let newdiagrams = [...diagrams];
    let distributed_diagrams = [newdiagrams[0]];
    for (let i = 1; i < newdiagrams.length; i++) {
        let prev_diagram = distributed_diagrams[i - 1];
        let this_diagram = newdiagrams[i];
        let prev_bottom = prev_diagram.get_anchor("bottom-left").y;
        let this_top = this_diagram.get_anchor("top-left").y;
        let dy = prev_bottom - this_top - space;
        distributed_diagrams.push(this_diagram.translate(V2$5(0, dy)));
    }
    return diagram_combine(...distributed_diagrams);
}
/**
 * Distribute diagrams horizontally and align
 * @param diagrams diagrams to be distributed
 * @param horizontal_space space between the diagrams (default = 0)
 * @param alignment vertical alignment of the diagrams
 * alignment can be 'top', 'center', or 'bottom'
 * @returns array of distributed and aligned diagrams
 */
function distribute_horizontal_and_align(diagrams, horizontal_space = 0, alignment = 'center') {
    return distribute_horizontal(align_vertical(diagrams, alignment).children, horizontal_space);
}
/**
 * Distribute diagrams vertically and align
 * @param diagrams diagrams to be distributed
 * @param vertical_space space between the diagrams (default = 0)
 * @param alignment horizontal alignment of the diagrams
 * alignment can be 'left', 'center', or 'right'
 * @returns array of distributed and aligned diagrams
 */
function distribute_vertical_and_align(diagrams, vertical_space = 0, alignment = 'center') {
    return distribute_vertical(align_horizontal(diagrams, alignment).children, vertical_space);
}
/**
 * Distribute diagrams in a grid
 * @param diagrams diagrams to be distributed
 * @param column_count number of columns
 * @param vectical_space space between the diagrams vertically (default = 0)
 * @param horizontal_space space between the diagrams horizontally (default = 0)
 * NODE: the behaviour is updated in v1.3.0
 * (now the returned diagram's children is the distributed diagrams instead of list of list of diagrams)
 */
function distribute_grid_row(diagrams, column_count, vectical_space = 0, horizontal_space = 0) {
    if (diagrams.length == 0) {
        return empty();
    }
    let newdiagrams = [...diagrams];
    let row_count = Math.ceil(newdiagrams.length / column_count);
    let rows = [];
    for (let i = 0; i < row_count; i++) {
        rows.push(newdiagrams.slice(i * column_count, (i + 1) * column_count));
    }
    let distributed_rows = rows.map(row => distribute_horizontal(row, horizontal_space));
    let distributed_diagrams = distribute_vertical(distributed_rows, vectical_space);
    let grid_diagrams = [];
    for (let i = 0; i < distributed_diagrams.children.length; i++) {
        for (let j = 0; j < distributed_diagrams.children[i].children.length; j++) {
            grid_diagrams.push(distributed_diagrams.children[i].children[j]);
        }
    }
    return diagram_combine(...grid_diagrams);
}
/**
 * Distribute diagrams in a variable width row
 * if there is a diagram that is wider than the container width, it will be placed in a separate row
 * @param diagrams diagrams to be distributed
 * @param container_width width of the container
 * @param vertical_space space between the diagrams vertically (default = 0)
 * @param horizontal_space space between the diagrams horizontally (default = 0)
 * @param vertical_alignment vertical alignment of the diagrams (default = 'center')
 * alignment can be 'top', 'center', or 'bottom'
 * @param horizontal_alignment horizontal alignment of the diagrams (default = 'left')
 * alignment can be 'left', 'center', or 'right'
 */
function distribute_variable_row(diagrams, container_width, vertical_space = 0, horizontal_space = 0, vertical_alignment = 'center', horizontal_alignment = 'left') {
    if (diagrams.length == 0) {
        return empty();
    }
    let rows = [];
    let current_row = [];
    let current_row_w = 0;
    function add_diagrams_to_rows(arr) {
        let distributed_row_dg = distribute_horizontal_and_align(arr, horizontal_space, vertical_alignment);
        rows.push(distributed_row_dg);
        current_row = [];
        current_row_w = 0;
    }
    for (let i = 0; i < diagrams.length; i++) {
        let d = diagrams[i];
        let w = size(d)[0];
        if (w > container_width) {
            if (current_row.length > 0)
                add_diagrams_to_rows(current_row);
            current_row.push(d);
            add_diagrams_to_rows(current_row);
            continue;
        }
        if (current_row_w + horizontal_space + w > container_width)
            add_diagrams_to_rows(current_row);
        current_row.push(d);
        current_row_w += w;
    }
    if (current_row.length > 0)
        add_diagrams_to_rows(current_row);
    // distribute vertically
    let distributed_diagrams = distribute_vertical_and_align(rows, vertical_space, horizontal_alignment);
    let row_diagrams = [];
    for (let i = 0; i < distributed_diagrams.children.length; i++) {
        for (let j = 0; j < distributed_diagrams.children[i].children.length; j++) {
            row_diagrams.push(distributed_diagrams.children[i].children[j]);
        }
    }
    return diagram_combine(...row_diagrams);
}

function format_number(val, prec) {
    let fixed = val.toFixed(prec);
    // remove trailing zeros
    // and if the last character is a dot, remove it
    return fixed.replace(/\.?0+$/, "");
}
const defaultFormat_f = (name, val, prec) => {
    let val_str = (typeof val == 'number' && prec != undefined) ? format_number(val, prec) : val.toString();
    return `${str_to_mathematical_italic(name)} = ${val_str}`;
};
var control_svg_name;
(function (control_svg_name) {
    control_svg_name["locator"] = "control_svg";
    control_svg_name["dnd"] = "dnd_svg";
    control_svg_name["custom"] = "custom_int_svg";
    control_svg_name["button"] = "button_svg";
})(control_svg_name || (control_svg_name = {}));
/**
 * Object that controls the interactivity of the diagram
 */
class Interactive {
    /**
     * @param control_container_div the div that contains the control elements
     * @param diagram_outer_svg the svg element that contains the diagram
     * \* _only needed if you want to use the locator_
     * @param inp_object_ the object that contains the variables
     * \* _only needed if you want to use custom input object_
     */
    constructor(control_container_div, diagram_outer_svg, inp_object_) {
        this.control_container_div = control_container_div;
        this.diagram_outer_svg = diagram_outer_svg;
        this.inp_variables = {};
        this.inp_setter = {};
        this.display_mode = "svg";
        this.diagram_svg = undefined;
        this.locator_svg = undefined;
        this.dnd_svg = undefined;
        this.custom_svg = undefined;
        this.button_svg = undefined;
        this.locatorHandler = undefined;
        this.dragAndDropHandler = undefined;
        this.buttonHandler = undefined;
        // no support for canvas yet
        this.draw_function = (_) => { };
        this.display_precision = 5;
        this.intervals = {};
        if (inp_object_ != undefined) {
            this.inp_variables = inp_object_;
        }
    }
    draw() {
        var _a, _b;
        this.draw_function(this.inp_variables, this.inp_setter);
        (_a = this.locatorHandler) === null || _a === void 0 ? void 0 : _a.setViewBox();
        (_b = this.dragAndDropHandler) === null || _b === void 0 ? void 0 : _b.setViewBox();
        set_viewbox(this.custom_svg, this.diagram_svg);
        set_viewbox(this.button_svg, this.diagram_svg);
        // TODO: also do this for the other control_svg
    }
    set(variable_name, val) {
        this.inp_setter[variable_name](val);
    }
    get(variable_name) {
        return this.inp_variables[variable_name];
    }
    label(variable_name, value, display_format_func = defaultFormat_f) {
        let labeldiv = document.createElement('div');
        labeldiv.classList.add("diagramatics-label");
        labeldiv.innerHTML = display_format_func(variable_name, value, this.display_precision);
        this.inp_variables[variable_name] = value;
        // setter ==========================
        const setter = (val) => {
            this.inp_variables[variable_name] = val;
            labeldiv.innerHTML = display_format_func(variable_name, val, this.display_precision);
        };
        this.inp_setter[variable_name] = setter;
        // ==============================
        // add components to div
        //
        // <div class="diagramatics-label-container">
        //     <div class="diagramatics-label"></div>
        // </div>
        let container = document.createElement('div');
        container.classList.add("diagramatics-label-container");
        container.appendChild(labeldiv);
        this.control_container_div.appendChild(container);
    }
    /**
     * WARNING: deprecated
     * use `locator_initial_draw` instead
     */
    locator_draw() {
        var _a;
        (_a = this.locatorHandler) === null || _a === void 0 ? void 0 : _a.setViewBox();
    }
    locator_initial_draw() {
        var _a;
        // TODO: generate the svg here
        (_a = this.locatorHandler) === null || _a === void 0 ? void 0 : _a.setViewBox();
    }
    /**
     * alias for `dnd_initial_draw`
     */
    drag_and_drop_initial_draw() {
        this.dnd_initial_draw();
    }
    dnd_initial_draw() {
        var _a, _b;
        (_a = this.dragAndDropHandler) === null || _a === void 0 ? void 0 : _a.setViewBox();
        (_b = this.dragAndDropHandler) === null || _b === void 0 ? void 0 : _b.drawSvg();
    }
    get_svg_element(metaname) {
        if (this.diagram_outer_svg == undefined)
            throw Error("diagram_outer_svg in Interactive class is undefined");
        // check if this.diagram_outer_svg has a child with meta=control_svg
        // if not, create one
        let svg_element = undefined;
        for (let i in this.diagram_outer_svg.children) {
            let child = this.diagram_outer_svg.children[i];
            if (child instanceof SVGSVGElement && child.getAttribute("meta") == metaname) {
                svg_element = child;
            }
        }
        if (svg_element == undefined) {
            svg_element = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg_element.setAttribute("meta", metaname);
            svg_element.setAttribute("width", "100%");
            svg_element.setAttribute("height", "100%");
            this.diagram_outer_svg.appendChild(svg_element);
        }
        return svg_element;
    }
    get_diagram_svg() {
        let diagram_svg = this.get_svg_element("diagram_svg");
        this.diagram_svg = diagram_svg;
        return diagram_svg;
    }
    /**
     * Create a locator
     * Locator is a draggable object that contain 2D coordinate information
     * @param variable_name name of the variable
     * @param value initial value
     * @param radius radius of the locator draggable object
     * @param color color of the locator
     * @param track_diagram if provided, the locator will snap to the closest point on the diagram
     */
    locator(variable_name, value, radius, color = 'blue', track_diagram, blink = true) {
        if (this.diagram_outer_svg == undefined)
            throw Error("diagram_outer_svg in Interactive class is undefined");
        this.inp_variables[variable_name] = value;
        let diagram_svg = this.get_diagram_svg();
        let control_svg = this.get_svg_element(control_svg_name.locator);
        this.locator_svg = control_svg;
        // if this is the fist time this function is called, create a locatorHandler
        if (this.locatorHandler == undefined) {
            let locatorHandler = new LocatorHandler(control_svg, diagram_svg);
            this.locatorHandler = locatorHandler;
            this.diagram_outer_svg.addEventListener('mousemove', (evt) => { locatorHandler.drag(evt); });
            this.diagram_outer_svg.addEventListener('mouseup', (evt) => { locatorHandler.endDrag(evt); });
            this.diagram_outer_svg.addEventListener('touchmove', (evt) => { locatorHandler.drag(evt); });
            this.diagram_outer_svg.addEventListener('touchend', (evt) => { locatorHandler.endDrag(evt); });
            this.diagram_outer_svg.addEventListener('touchcancel', (evt) => { locatorHandler.endDrag(evt); });
        }
        // ============== callback
        const callback = (pos, redraw = true) => {
            this.inp_variables[variable_name] = pos;
            if (redraw)
                this.draw();
        };
        this.locatorHandler.registerCallback(variable_name, callback);
        // ============== Circle element
        let locator_svg = LocatorHandler.create_locator_circle_pointer_svg(radius, value, color, blink);
        if (blink) {
            // store the circle_outer into the LocatorHandler so that we can turn it off later
            let blinking_outers = locator_svg.getElementsByClassName("diagramatics-locator-blink");
            for (let i = 0; i < blinking_outers.length; i++)
                this.locatorHandler.addBlinkingCircleOuter(blinking_outers[i]);
        }
        locator_svg.addEventListener('mousedown', (evt) => {
            this.locatorHandler.startDrag(evt, variable_name, locator_svg);
        });
        locator_svg.addEventListener('touchstart', (evt) => {
            this.locatorHandler.startDrag(evt, variable_name, locator_svg);
        });
        control_svg.appendChild(locator_svg);
        // =============== setter
        let setter;
        if (track_diagram) {
            if (track_diagram.type != DiagramType.Polygon && track_diagram.type != DiagramType.Curve)
                throw Error('Track diagram must be a polygon or curve');
            if (track_diagram.path == undefined)
                throw Error(`diagram {diagtam.type} must have a path`);
            let track = track_diagram.path.points;
            setter = (pos) => {
                let coord = closest_point_from_points(pos, track);
                locator_svg.setAttributeNS(null, "x", coord.x.toString());
                locator_svg.setAttributeNS(null, "y", (-coord.y).toString());
                return coord;
            };
        }
        else {
            setter = (pos) => {
                locator_svg.setAttributeNS(null, "x", pos.x.toString());
                locator_svg.setAttributeNS(null, "y", (-pos.y).toString());
                return pos;
            };
        }
        this.locatorHandler.registerSetter(variable_name, setter);
        // set initial position
        let init_pos = setter(value);
        callback(init_pos, false);
    }
    // TODO: in the next breaking changes update,
    // merge this function with locator
    /**
     * Create a locator with custom diagram object
     * @param variable_name name of the variable
     * @param value initial value
     * @param diagram diagram of the locator
     * @param track_diagram if provided, the locator will snap to the closest point on the diagram
     * @param blink if true, the locator will blink
     */
    locator_custom(variable_name, value, diagram, track_diagram, blink = true) {
        if (this.diagram_outer_svg == undefined)
            throw Error("diagram_outer_svg in Interactive class is undefined");
        this.inp_variables[variable_name] = value;
        let diagram_svg = this.get_diagram_svg();
        let control_svg = this.get_svg_element(control_svg_name.locator);
        this.locator_svg = control_svg;
        // if this is the fist time this function is called, create a locatorHandler
        if (this.locatorHandler == undefined) {
            let locatorHandler = new LocatorHandler(control_svg, diagram_svg);
            this.locatorHandler = locatorHandler;
            this.diagram_outer_svg.addEventListener('mousemove', (evt) => { locatorHandler.drag(evt); });
            this.diagram_outer_svg.addEventListener('mouseup', (evt) => { locatorHandler.endDrag(evt); });
            this.diagram_outer_svg.addEventListener('touchmove', (evt) => { locatorHandler.drag(evt); });
            this.diagram_outer_svg.addEventListener('touchend', (evt) => { locatorHandler.endDrag(evt); });
            this.diagram_outer_svg.addEventListener('touchcancel', (evt) => { locatorHandler.endDrag(evt); });
        }
        // ============== callback
        const callback = (pos, redraw = true) => {
            this.inp_variables[variable_name] = pos;
            if (redraw)
                this.draw();
        };
        this.locatorHandler.registerCallback(variable_name, callback);
        // ============== Circle element
        let locator_svg = this.locatorHandler.create_locator_diagram_svg(diagram, blink);
        locator_svg.addEventListener('mousedown', (evt) => {
            this.locatorHandler.startDrag(evt, variable_name, locator_svg);
        });
        locator_svg.addEventListener('touchstart', (evt) => {
            this.locatorHandler.startDrag(evt, variable_name, locator_svg);
        });
        control_svg.appendChild(locator_svg);
        // =============== setter
        let setter;
        if (track_diagram) {
            if (track_diagram.type != DiagramType.Polygon && track_diagram.type != DiagramType.Curve)
                throw Error('Track diagram must be a polygon or curve');
            if (track_diagram.path == undefined)
                throw Error(`diagram {diagtam.type} must have a path`);
            let track = track_diagram.path.points;
            setter = (pos) => {
                let coord = closest_point_from_points(pos, track);
                locator_svg.setAttributeNS(null, "x", coord.x.toString());
                locator_svg.setAttributeNS(null, "y", (-coord.y).toString());
                return coord;
            };
        }
        else {
            setter = (pos) => {
                locator_svg.setAttributeNS(null, "x", pos.x.toString());
                locator_svg.setAttributeNS(null, "y", (-pos.y).toString());
                return pos;
            };
        }
        this.locatorHandler.registerSetter(variable_name, setter);
        // set initial position
        let init_pos = setter(value);
        callback(init_pos, false);
    }
    /**
     * Create a slider
     * @param variable_name name of the variable
     * @param min minimum value
     * @param max maximum value
     * @param value initial value
     * @param step step size
     * @param time time of the animation in milliseconds
     * @param display_format_func function to format the display of the value
    */
    slider(variable_name, min = 0, max = 100, value = 50, step = -1, time = 1.5, display_format_func = defaultFormat_f) {
        // if the step is -1, then it is automatically calculated
        if (step == -1) {
            step = (max - min) / 100;
        }
        // initialize the variable
        this.inp_variables[variable_name] = value;
        // =========== label =============
        let labeldiv = document.createElement('div');
        labeldiv.classList.add("diagramatics-label");
        labeldiv.innerHTML = display_format_func(variable_name, value, this.display_precision);
        // =========== slider ===========
        // create the callback function
        const callback = (val, redraw = true) => {
            this.inp_variables[variable_name] = val;
            labeldiv.innerHTML = display_format_func(variable_name, val, this.display_precision);
            if (redraw)
                this.draw();
        };
        let slider = create_slider(callback, min, max, value, step);
        // ================ setter
        const setter = (val) => {
            slider.value = val.toString();
            callback(val, false);
        };
        this.inp_setter[variable_name] = setter;
        // =========== playbutton ========
        let nstep = (max - min) / step;
        const interval_time = 1000 * time / nstep;
        let playbutton = document.createElement('button');
        let symboldiv = document.createElement('div');
        symboldiv.classList.add("diagramatics-slider-playbutton-symbol");
        playbutton.appendChild(symboldiv);
        playbutton.classList.add("diagramatics-slider-playbutton");
        playbutton.onclick = () => {
            if (this.intervals[variable_name] == undefined) {
                // if is not playing
                playbutton.classList.add("paused");
                this.intervals[variable_name] = setInterval(() => {
                    let val = parseFloat(slider.value);
                    val += step;
                    // wrap around
                    val = ((val - min) % (max - min)) + min;
                    slider.value = val.toString();
                    callback(val);
                }, interval_time);
            }
            else {
                // if is playing
                playbutton.classList.remove("paused");
                clearInterval(this.intervals[variable_name]);
                this.intervals[variable_name] = undefined;
            }
        };
        // ==============================
        // add components to div
        //
        // <div class="diagramatics-slider-leftcontainer">
        //     <br>
        //     <button class="diagramatics-slider-playbutton"></button>
        // </div>
        // <div class="diagramatics-slider-rightcontainer">
        //     <div class="diagramatics-label"></div>
        //     <input type="range"class="diagramatics-slider">
        // </div>
        //
        let leftcontainer = document.createElement('div');
        leftcontainer.classList.add("diagramatics-slider-leftcontainer");
        leftcontainer.appendChild(document.createElement('br'));
        leftcontainer.appendChild(playbutton);
        let rightcontainer = document.createElement('div');
        rightcontainer.classList.add("diagramatics-slider-rightcontainer");
        rightcontainer.appendChild(labeldiv);
        rightcontainer.appendChild(slider);
        let container = document.createElement('div');
        container.classList.add("diagramatics-slider-container");
        container.appendChild(leftcontainer);
        container.appendChild(rightcontainer);
        this.control_container_div.appendChild(container);
    }
    init_drag_and_drop() {
        if (this.diagram_outer_svg == undefined)
            throw Error("diagram_outer_svg in Interactive class is undefined");
        let diagram_svg = this.get_diagram_svg();
        let dnd_svg = this.get_svg_element(control_svg_name.dnd);
        this.dnd_svg = dnd_svg;
        // if this is the fist time this function is called, create a dragAndDropHandler
        if (this.dragAndDropHandler == undefined) {
            let dragAndDropHandler = new DragAndDropHandler(dnd_svg, diagram_svg);
            this.dragAndDropHandler = dragAndDropHandler;
            this.diagram_outer_svg.addEventListener('mousemove', (evt) => { dragAndDropHandler.drag(evt); });
            this.diagram_outer_svg.addEventListener('mouseup', (evt) => { dragAndDropHandler.endDrag(evt); });
            this.diagram_outer_svg.addEventListener('touchmove', (evt) => { dragAndDropHandler.drag(evt); });
            this.diagram_outer_svg.addEventListener('touchend', (evt) => { dragAndDropHandler.endDrag(evt); });
            this.diagram_outer_svg.addEventListener('touchcancel', (evt) => { dragAndDropHandler.endDrag(evt); });
        }
    }
    /**
     * Create a drag and drop container
     * @param name name of the container
     * @param diagram diagram of the container
     * @param capacity capacity of the container (default is 1)
     * @param config configuration of the container positioning
     * the configuration is an object with the following format:
     * `{type:"horizontal"}` or `{type:"vertical"}` or `{type:"grid", value:[number, number]}`
    */
    dnd_container(name, diagram, capacity = 1, config) {
        var _a;
        this.init_drag_and_drop();
        (_a = this.dragAndDropHandler) === null || _a === void 0 ? void 0 : _a.add_container(name, diagram, capacity, config);
    }
    // TODO: in the next breaking changes update,
    // merge this function with dnd_draggable_to_container
    /**
     * Create a drag and drop draggable that is positioned into an existing container
     * @param name name of the draggable
     * @param diagram diagram of the draggable
     * @param container_name name of the container
     * @param callback callback function when the draggable is moved
     */
    dnd_draggable_to_container(name, diagram, container_name, callback) {
        this.init_drag_and_drop();
        if (this.dragAndDropHandler == undefined)
            throw Error("dragAndDropHandler in Interactive class is undefined");
        this.inp_variables[name] = diagram.origin;
        this.dragAndDropHandler.add_draggable_to_container(name, diagram, container_name);
        const dnd_callback = (pos, redraw = true) => {
            this.inp_variables[name] = pos;
            if (callback)
                callback(name, container_name);
            if (redraw)
                this.draw();
        };
        this.dragAndDropHandler.registerCallback(name, dnd_callback);
    }
    /**
     * Create a drag and drop draggable
     * @param name name of the draggable
     * @param diagram diagram of the draggable
     * @param container_diagram diagram of the container, if not provided, a container will be created automatically
     * @param callback callback function when the draggable is moved
    */
    dnd_draggable(name, diagram, container_diagram, callback) {
        this.init_drag_and_drop();
        if (this.dragAndDropHandler == undefined)
            throw Error("dragAndDropHandler in Interactive class is undefined");
        this.inp_variables[name] = diagram.origin;
        this.dragAndDropHandler.add_draggable_with_container(name, diagram, container_diagram);
        const dnd_callback = (pos, redraw = true) => {
            this.inp_variables[name] = pos;
            if (callback)
                callback(name, pos);
            if (redraw)
                this.draw();
        };
        this.dragAndDropHandler.registerCallback(name, dnd_callback);
    }
    /**
     * Register a callback function when a draggable is dropped outside of a container
     * @param callback callback function
     */
    dnd_register_drop_outside_callback(callback) {
        var _a;
        (_a = this.dragAndDropHandler) === null || _a === void 0 ? void 0 : _a.register_dropped_outside_callback(callback);
    }
    /**
     * Move a draggable to a container
     * @param name name of the draggable
     * @param container_name name of the container
     */
    dnd_move_to_container(name, container_name) {
        var _a;
        (_a = this.dragAndDropHandler) === null || _a === void 0 ? void 0 : _a.try_move_draggable_to_container(name, container_name);
    }
    /**
     * Get the data of the drag and drop objects with the format:
     * `{container:string, content:string[]}[]`
    */
    get_dnd_data() {
        var _a, _b;
        return (_b = (_a = this.dragAndDropHandler) === null || _a === void 0 ? void 0 : _a.getData()) !== null && _b !== void 0 ? _b : [];
    }
    /**
     * Set the data of the drag and drop objects with the format:
     * `{container:string, content:string[]}[]`
     */
    set_dnd_data(data) {
        var _a;
        (_a = this.dragAndDropHandler) === null || _a === void 0 ? void 0 : _a.setData(data);
    }
    /**
     * Create a custom interactive object
     * @param id id of the object
     * @param classlist list of classes of the object
     * @param diagram diagram of the object
     * @returns the svg element of the object
     */
    custom_object(id, classlist, diagram) {
        if (this.diagram_outer_svg == undefined)
            throw Error("diagram_outer_svg in Interactive class is undefined");
        let diagram_svg = this.get_diagram_svg();
        let control_svg = this.get_svg_element(control_svg_name.custom);
        let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        f_draw_to_svg(svg, diagram, true, calculate_text_scale(diagram_svg));
        svg.setAttribute("overflow", "visible");
        svg.setAttribute("class", classlist.join(" "));
        svg.setAttribute("id", id);
        control_svg.appendChild(svg);
        this.custom_svg = control_svg;
        return svg;
    }
    init_button() {
        if (this.diagram_outer_svg == undefined)
            throw Error("diagram_outer_svg in Interactive class is undefined");
        let diagram_svg = this.get_diagram_svg();
        let button_svg = this.get_svg_element(control_svg_name.button);
        this.button_svg = button_svg;
        // if this is the fist time this function is called, create a dragAndDropHandler
        if (this.buttonHandler == undefined) {
            let buttonHandler = new ButtonHandler(button_svg, diagram_svg);
            this.buttonHandler = buttonHandler;
        }
    }
    /**
     * Create a toggle button
     * @param name name of the button
     * @param diagram_on diagram of the button when it is on
     * @param diagram_off diagram of the button when it is off
     * @param state initial state of the button
     * @param callback callback function when the button state is changed
    */
    button_toggle(name, diagram_on, diagram_off, state = false, callback) {
        this.init_button();
        if (this.buttonHandler == undefined)
            throw Error("buttonHandler in Interactive class is undefined");
        this.inp_variables[name] = state;
        let main_callback;
        if (callback) {
            main_callback = (state, redraw = true) => {
                this.inp_variables[name] = state;
                callback(name, state);
                if (redraw)
                    this.draw();
            };
        }
        else {
            main_callback = (state, redraw = true) => {
                this.inp_variables[name] = state;
                if (redraw)
                    this.draw();
            };
        }
        let setter = this.buttonHandler.try_add_toggle(name, diagram_on, diagram_off, state, main_callback);
        this.inp_setter[name] = setter;
    }
    /**
     * Create a click button
     * @param name name of the button
     * @param diagram diagram of the button
     * @param diagram_pressed diagram of the button when it is pressed
     * @param callback callback function when the button is clicked
    */
    button_click(name, diagram, diagram_pressed, callback) {
        this.init_button();
        if (this.buttonHandler == undefined)
            throw Error("buttonHandler in Interactive class is undefined");
        let n_callback = () => { callback(); this.draw(); };
        this.buttonHandler.try_add_click(name, diagram, diagram_pressed, n_callback);
    }
}
// ========== functions
//
function set_viewbox(taget, source) {
    if (taget == undefined)
        return;
    if (source == undefined)
        return;
    taget.setAttribute("viewBox", source.getAttribute("viewBox"));
    taget.setAttribute("preserveAspectRatio", source.getAttribute("preserveAspectRatio"));
}
function create_slider(callback, min = 0, max = 100, value = 50, step) {
    // create a slider
    let slider = document.createElement("input");
    slider.type = "range";
    slider.min = min.toString();
    slider.max = max.toString();
    slider.value = value.toString();
    slider.step = step.toString();
    slider.oninput = () => {
        let val = slider.value;
        callback(parseFloat(val));
    };
    // add class to slider
    slider.classList.add("diagramatics-slider");
    return slider;
}
// function create_locator() : SVGCircleElement {
// }
//
function closest_point_from_points(p, points) {
    if (points.length == 0)
        return p;
    let closest_d2 = Infinity;
    let closest_p = points[0];
    for (let i = 0; i < points.length; i++) {
        let d2 = points[i].sub(p).length_sq();
        if (d2 < closest_d2) {
            closest_d2 = d2;
            closest_p = points[i];
        }
    }
    return closest_p;
}
// helper to calculate CTM in firefox
// there's a well known bug in firefox about `getScreenCTM()`
function firefox_calcCTM(svgelem) {
    let ctm = svgelem.getScreenCTM();
    // get screen width and height of the element
    let screenWidth = svgelem.width.baseVal.value;
    let screenHeight = svgelem.height.baseVal.value;
    let viewBox = svgelem.viewBox.baseVal;
    let scalex = screenWidth / viewBox.width;
    let scaley = screenHeight / viewBox.height;
    let scale = Math.min(scalex, scaley);
    // let translateX = (screenWidth/2  + ctm.e) - (viewBox.width/2  + viewBox.x) * scale;
    // let translateY = (screenHeight/2 + ctm.f) - (viewBox.height/2 + viewBox.y) * scale;
    let translateX = (screenWidth / 2) - (viewBox.width / 2 + viewBox.x) * scale;
    let translateY = (screenHeight / 2) - (viewBox.height / 2 + viewBox.y) * scale;
    return DOMMatrix.fromMatrix(ctm).translate(translateX, translateY).scale(scale);
}
/**
 * Convert client position to SVG position
 * @param clientPos the client position
 * @param svgelem the svg element
 */
function clientPos_to_svgPos(clientPos, svgelem) {
    // var CTM = this.control_svg.getScreenCTM() as DOMMatrix;
    // NOTE: there's a well known bug in firefox about `getScreenCTM()`
    // check if the browser is firefox
    let CTM;
    if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
        CTM = firefox_calcCTM(svgelem);
    }
    else {
        CTM = svgelem.getScreenCTM();
    }
    // console.log(CTM);
    return {
        x: (clientPos.x - CTM.e) / CTM.a,
        y: -(clientPos.y - CTM.f) / CTM.d
    };
}
function getMousePosition(evt, svgelem) {
    // firefox doesn't support `TouchEvent`, we need to check for it
    if (window.TouchEvent && evt instanceof TouchEvent) {
        evt = evt.touches[0];
    }
    let clientPos = {
        x: evt.clientX,
        y: evt.clientY
    };
    return clientPos_to_svgPos(clientPos, svgelem);
}
/**
 * Get the SVG coordinate from the event (MouseEvent or TouchEvent)
 * @param evt the event
 * @param svgelem the svg element
 * @returns the SVG coordinate
 */
function get_SVGPos_from_event(evt, svgelem) {
    return getMousePosition(evt, svgelem);
}
class LocatorHandler {
    constructor(control_svg, diagram_svg) {
        this.control_svg = control_svg;
        this.diagram_svg = diagram_svg;
        this.selectedElement = null;
        this.selectedVariable = null;
        this.callbacks = {};
        this.setter = {};
        // store blinking circle_outer so that we can turn it off
        this.blinking_circle_outers = [];
        this.first_touch_callback = null;
    }
    startDrag(_, variable_name, selectedElement) {
        this.selectedElement = selectedElement;
        this.selectedVariable = variable_name;
        this.handleBlinking();
    }
    drag(evt) {
        if (this.selectedElement == undefined)
            return;
        if (this.selectedVariable == undefined)
            return;
        if (evt instanceof MouseEvent) {
            evt.preventDefault();
        }
        if (window.TouchEvent && evt instanceof TouchEvent) {
            evt.preventDefault();
        }
        let coord = getMousePosition(evt, this.control_svg);
        let pos = V2$5(coord.x, coord.y);
        // check if setter for this.selectedVariable exists
        // if it does, call it
        if (this.setter[this.selectedVariable] != undefined) {
            pos = this.setter[this.selectedVariable](pos);
        }
        // check if callback for this.selectedVariable exists
        // if it does, call it
        if (this.selectedVariable == null)
            return;
        if (this.callbacks[this.selectedVariable] != undefined) {
            this.callbacks[this.selectedVariable](pos);
        }
        this.setViewBox();
    }
    setViewBox() {
        // set viewBox and preserveAspectRatio of control_svg to be the same as diagram_svg
        this.control_svg.setAttribute("viewBox", this.diagram_svg.getAttribute("viewBox"));
        this.control_svg.setAttribute("preserveAspectRatio", this.diagram_svg.getAttribute("preserveAspectRatio"));
    }
    endDrag(_) {
        this.selectedElement = null;
        this.selectedVariable = null;
    }
    registerCallback(name, callback) {
        this.callbacks[name] = callback;
    }
    registerSetter(name, setter) {
        this.setter[name] = setter;
    }
    addBlinkingCircleOuter(circle_outer) {
        this.blinking_circle_outers.push(circle_outer);
    }
    handleBlinking() {
        // turn off all blinking_circle_outers after the first touch
        if (this.blinking_circle_outers.length == 0)
            return;
        for (let i = 0; i < this.blinking_circle_outers.length; i++) {
            this.blinking_circle_outers[i].classList.remove("diagramatics-locator-blink");
        }
        this.blinking_circle_outers = [];
        if (this.first_touch_callback != null)
            this.first_touch_callback();
    }
    create_locator_diagram_svg(diagram, blink) {
        let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        f_draw_to_svg(svg, diagram.position(V2$5(0, 0)), true, calculate_text_scale(this.diagram_svg));
        svg.style.cursor = "pointer";
        svg.setAttribute("overflow", "visible");
        if (blink) {
            svg.classList.add("diagramatics-locator-blink");
            this.addBlinkingCircleOuter(svg);
        }
        return svg;
    }
    static create_locator_circle_pointer_svg(radius, value, color, blink) {
        let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        // set svg overflow to visible
        svg.setAttribute("overflow", "visible");
        // set cursor to be pointer when hovering
        svg.style.cursor = "pointer";
        let circle_outer = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        let circle_inner = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        let inner_radius = radius * 0.4;
        circle_outer.setAttribute("r", radius.toString());
        circle_outer.setAttribute("fill", get_color(color, tab_color));
        circle_outer.setAttribute("fill-opacity", "0.3137");
        circle_outer.setAttribute("stroke", "none");
        circle_outer.classList.add("diagramatics-locator-outer");
        if (blink)
            circle_outer.classList.add("diagramatics-locator-blink");
        circle_inner.setAttribute("r", inner_radius.toString());
        circle_inner.setAttribute("fill", get_color(color, tab_color));
        circle_inner.setAttribute("stroke", "none");
        circle_inner.classList.add("diagramatics-locator-inner");
        svg.appendChild(circle_outer);
        svg.appendChild(circle_inner);
        svg.setAttribute("x", value.x.toString());
        svg.setAttribute("y", (-value.y).toString());
        return svg;
    }
}
var dnd_type;
(function (dnd_type) {
    dnd_type["container"] = "diagramatics-dnd-container";
    dnd_type["draggable"] = "diagramatics-dnd-draggable";
    dnd_type["ghost"] = "diagramatics-dnd-draggable-ghost";
})(dnd_type || (dnd_type = {}));
class DragAndDropHandler {
    constructor(dnd_svg, diagram_svg) {
        this.dnd_svg = dnd_svg;
        this.diagram_svg = diagram_svg;
        this.containers = {};
        this.draggables = {};
        this.callbacks = {};
        this.hoveredContainerName = null;
        this.draggedElementName = null;
        this.draggedElementGhost = null;
        this.dropped_outside_callback = null;
    }
    add_container(name, diagram, capacity = 1, position_config = { type: "horizontal" }) {
        if (this.containers[name] != undefined)
            throw Error(`container with name ${name} already exists`);
        let position_function = capacity == 1 ?
            (_index) => diagram.origin :
            DragAndDropHandler.generate_position_function(diagram, position_config, capacity);
        this.containers[name] = { name, diagram, position: diagram.origin, content: [], capacity, position_function };
    }
    static generate_position_function(diagram, config, capacity) {
        let bbox = diagram.bounding_box();
        let p_center = diagram.origin;
        switch (config.type) {
            case "horizontal": {
                let width = bbox[1].x - bbox[0].x;
                let dx = width / capacity;
                let x0 = bbox[0].x + dx / 2;
                let y = p_center.y;
                return (index) => V2$5(x0 + dx * index, y);
            }
            case "vertical": {
                //NOTE: top to bottom
                let height = bbox[1].y - bbox[0].y;
                let dy = height / capacity;
                let x = p_center.x;
                let y0 = bbox[1].y - dy / 2;
                return (index) => V2$5(x, y0 - dy * index);
            }
            case "grid": {
                let [nx, ny] = config.value;
                let height = bbox[1].y - bbox[0].y;
                let width = bbox[1].x - bbox[0].x;
                let dx = width / nx;
                let dy = height / ny;
                let x0 = bbox[0].x + dx / 2;
                let y0 = bbox[1].y - dy / 2;
                return (index) => {
                    let x = x0 + dx * (index % nx);
                    let y = y0 - dy * Math.floor(index / nx);
                    return V2$5(x, y);
                };
            }
        }
    }
    add_draggable_to_container(name, diagram, container_name) {
        if (this.draggables[name] != undefined)
            throw Error(`draggable with name ${name} already exists`);
        this.draggables[name] = { name, diagram, position: diagram.origin, container: container_name };
        this.containers[container_name].content.push(name);
    }
    add_draggable_with_container(name, diagram, container_diagram) {
        if (this.draggables[name] != undefined)
            throw Error(`draggable with name ${name} already exists`);
        // add a container as initial container for the draggable
        let initial_container_name = `_container0_${name}`;
        if (container_diagram == undefined)
            container_diagram = this.diagram_container_from_draggable(diagram);
        this.add_container(initial_container_name, container_diagram);
        this.containers[initial_container_name].content.push(name);
        this.draggables[name] = { name, diagram, position: diagram.origin, container: initial_container_name };
    }
    registerCallback(name, callback) {
        this.callbacks[name] = callback;
    }
    register_dropped_outside_callback(callback) {
        this.dropped_outside_callback = callback;
    }
    setViewBox() {
        // set viewBox and preserveAspectRatio of control_svg to be the same as diagram_svg
        this.dnd_svg.setAttribute("viewBox", this.diagram_svg.getAttribute("viewBox"));
        this.dnd_svg.setAttribute("preserveAspectRatio", this.diagram_svg.getAttribute("preserveAspectRatio"));
    }
    drawSvg() {
        for (let name in this.containers)
            this.add_container_svg(name, this.containers[name].diagram);
        for (let name in this.draggables)
            this.add_draggable_svg(name, this.draggables[name].diagram);
        for (let name in this.containers)
            this.reposition_container_content(name);
    }
    getData() {
        let data = [];
        for (let name in this.containers) {
            data.push({ container: name, content: this.containers[name].content });
        }
        return data;
    }
    setData(data) {
        try {
            for (let containerdata of data) {
                for (let content of containerdata.content) {
                    this.try_move_draggable_to_container(content, containerdata.container);
                }
            }
        }
        catch (_e) {
            console.error("the data is not valid");
        }
    }
    diagram_container_from_draggable(diagram) {
        let rect = rectangle_corner(...diagram.bounding_box()).move_origin(diagram.origin);
        return rect.strokedasharray([5]);
    }
    add_container_svg(name, diagram) {
        let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        f_draw_to_svg(svg, diagram.position(V2$5(0, 0)), false, calculate_text_scale(this.dnd_svg), dnd_type.container);
        let position = diagram.origin;
        svg.setAttribute("overflow", "visible");
        svg.setAttribute("x", position.x.toString());
        svg.setAttribute("y", (-position.y).toString());
        svg.setAttribute("class", dnd_type.container);
        svg.setAttribute("id", name);
        this.dnd_svg.prepend(svg);
        this.containers[name].svgelement = svg;
    }
    add_draggable_svg(name, diagram) {
        let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        f_draw_to_svg(svg, diagram.position(V2$5(0, 0)), true, calculate_text_scale(this.dnd_svg), dnd_type.draggable);
        let position = diagram.origin;
        svg.setAttribute("overflow", "visible");
        svg.setAttribute("x", position.x.toString());
        svg.setAttribute("y", (-position.y).toString());
        svg.setAttribute("class", dnd_type.draggable);
        svg.setAttribute("id", name);
        svg.setAttribute("draggable", "true");
        svg.onmousedown = (evt) => {
            this.draggedElementName = name;
            this.startDrag(evt);
        };
        svg.ontouchstart = (evt) => {
            this.draggedElementName = name;
            this.startDrag(evt);
        };
        this.dnd_svg.append(svg);
        this.draggables[name].svgelement = svg;
    }
    reposition_container_content(container_name) {
        var _a, _b;
        let container = this.containers[container_name];
        if (container == undefined)
            return;
        for (let i = 0; i < container.content.length; i++) {
            let draggable = this.draggables[container.content[i]];
            let pos = container.position_function(i);
            draggable.position = pos;
            (_a = draggable.svgelement) === null || _a === void 0 ? void 0 : _a.setAttribute("x", pos.x.toString());
            (_b = draggable.svgelement) === null || _b === void 0 ? void 0 : _b.setAttribute("y", (-pos.y).toString());
        }
    }
    remove_draggable_from_container(draggable_name, container_name) {
        this.containers[container_name].content =
            this.containers[container_name].content.filter((name) => name != draggable_name);
    }
    move_draggable_to_container(draggable_name, container_name) {
        let draggable = this.draggables[draggable_name];
        // ignore if the draggable is already in the container
        if (draggable.container == container_name)
            return;
        let container = this.containers[container_name];
        let original_container_name = draggable.container;
        this.remove_draggable_from_container(draggable_name, original_container_name);
        draggable.container = container_name;
        container.content.push(draggable_name);
        this.reposition_container_content(container_name);
        this.reposition_container_content(original_container_name);
        let draggedElement = this.draggables[draggable_name];
        this.callbacks[draggedElement.name](draggedElement.position);
    }
    try_move_draggable_to_container(draggable_name, container_name) {
        let draggable = this.draggables[draggable_name];
        let container = this.containers[container_name];
        if (container.content.length + 1 <= container.capacity) {
            this.move_draggable_to_container(draggable_name, container_name);
        }
        else if (container.capacity == 1) {
            // only swap if the container has only 1 capacity
            // swap
            let original_container_name = draggable.container;
            let other_draggable_name = container.content[0];
            this.move_draggable_to_container(other_draggable_name, original_container_name);
            this.move_draggable_to_container(draggable_name, container_name);
        }
    }
    startDrag(evt) {
        if (evt instanceof MouseEvent) {
            evt.preventDefault();
        }
        if (window.TouchEvent && evt instanceof TouchEvent) {
            evt.preventDefault();
        }
        this.hoveredContainerName = null;
        // reset container hovered class
        this.reset_hovered_class();
        // delete orphaned ghost
        let ghosts = this.dnd_svg.getElementsByClassName(dnd_type.ghost);
        for (let i = 0; i < ghosts.length; i++)
            ghosts[i].remove();
        // create a clone of the dragged element
        if (this.draggedElementName == null)
            return;
        let draggable = this.draggables[this.draggedElementName];
        if (draggable.svgelement == undefined)
            return;
        draggable.svgelement.classList.add("picked");
        this.draggedElementGhost = draggable.svgelement.cloneNode(true);
        // set pointer-events : none
        this.draggedElementGhost.style.pointerEvents = "none";
        this.draggedElementGhost.setAttribute("opacity", "0.5");
        this.draggedElementGhost.setAttribute("class", dnd_type.ghost);
        this.dnd_svg.prepend(this.draggedElementGhost);
    }
    get_dnd_element_data_from_evt(evt) {
        let element = null;
        if (window.TouchEvent && evt instanceof TouchEvent) {
            let evt_touch = evt.touches[0];
            element = document.elementFromPoint(evt_touch.clientX, evt_touch.clientY);
        }
        else if (!(evt instanceof TouchEvent)) {
            element = document.elementFromPoint(evt.clientX, evt.clientY);
        }
        if (element == null)
            return null;
        let dg_tag = element.getAttribute("_dg_tag");
        if (dg_tag == null)
            return null;
        if (dg_tag == dnd_type.container) {
            let parent = element.parentElement;
            if (parent == null)
                return null;
            let name = parent.getAttribute("id");
            if (name == null)
                return null;
            return { name, type: dnd_type.container };
        }
        if (dg_tag == dnd_type.draggable) {
            let parent = element.parentElement;
            if (parent == null)
                return null;
            let name = parent.getAttribute("id");
            if (name == null)
                return null;
            return { name, type: dnd_type.draggable };
        }
        return null;
    }
    drag(evt) {
        var _a, _b, _c;
        if (this.draggedElementName == null)
            return;
        if (this.draggedElementGhost == null)
            return;
        if (evt instanceof MouseEvent) {
            evt.preventDefault();
        }
        if (window.TouchEvent && evt instanceof TouchEvent) {
            evt.preventDefault();
        }
        this.reset_hovered_class();
        let element_data = this.get_dnd_element_data_from_evt(evt);
        if (element_data == null) {
            this.hoveredContainerName = null;
        }
        else if (element_data.type == dnd_type.container) {
            this.hoveredContainerName = element_data.name;
            (_a = this.containers[element_data.name].svgelement) === null || _a === void 0 ? void 0 : _a.classList.add("hovered");
        }
        else if (element_data.type == dnd_type.draggable) {
            this.hoveredContainerName = (_b = this.draggables[element_data.name]) === null || _b === void 0 ? void 0 : _b.container;
            (_c = this.draggables[element_data.name].svgelement) === null || _c === void 0 ? void 0 : _c.classList.add("hovered");
            // this.containers[this.hoveredContainerName]?.svgelement?.classList.add("hovered");
        }
        let coord = getMousePosition(evt, this.dnd_svg);
        this.draggedElementGhost.setAttribute("x", coord.x.toString());
        this.draggedElementGhost.setAttribute("y", (-coord.y).toString());
    }
    endDrag(_evt) {
        if (this.hoveredContainerName != null && this.draggedElementName != null) {
            this.try_move_draggable_to_container(this.draggedElementName, this.hoveredContainerName);
        }
        // if dropped outside of any container
        if (this.hoveredContainerName == null && this.draggedElementName != null
            && this.dropped_outside_callback != null) {
            this.dropped_outside_callback(this.draggedElementName);
        }
        this.draggedElementName = null;
        this.hoveredContainerName = null;
        this.reset_hovered_class();
        this.reset_picked_class();
        if (this.draggedElementGhost != null) {
            this.draggedElementGhost.remove();
            this.draggedElementGhost = null;
        }
    }
    reset_hovered_class() {
        var _a, _b;
        for (let name in this.containers) {
            (_a = this.containers[name].svgelement) === null || _a === void 0 ? void 0 : _a.classList.remove("hovered");
        }
        for (let name in this.draggables) {
            (_b = this.draggables[name].svgelement) === null || _b === void 0 ? void 0 : _b.classList.remove("hovered");
        }
    }
    reset_picked_class() {
        var _a;
        for (let name in this.draggables) {
            (_a = this.draggables[name].svgelement) === null || _a === void 0 ? void 0 : _a.classList.remove("picked");
        }
    }
}
class ButtonHandler {
    constructor(button_svg, diagram_svg) {
        this.button_svg = button_svg;
        this.diagram_svg = diagram_svg;
        // callbacks : {[key : string] : (state : boolean) => any} = {};
        this.states = {};
        this.svg_element = {};
        this.touchdownName = null;
    }
    /** add a new toggle button if it doesn't exist, otherwise, update diagrams and callback */
    try_add_toggle(name, diagram_on, diagram_off, state, callback) {
        if (this.svg_element[name] != undefined) {
            // delete the old button
            let [old_svg_on, old_svg_off] = this.svg_element[name];
            old_svg_on.remove();
            old_svg_off.remove();
        }
        return this.add_toggle(name, diagram_on, diagram_off, state, callback);
    }
    add_toggle(name, diagram_on, diagram_off, state, callback) {
        let svg_off = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        f_draw_to_svg(svg_off, diagram_off, true, calculate_text_scale(this.diagram_svg));
        svg_off.setAttribute("overflow", "visible");
        svg_off.style.cursor = "pointer";
        let svg_on = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        f_draw_to_svg(svg_on, diagram_on, true, calculate_text_scale(this.diagram_svg));
        svg_on.setAttribute("overflow", "visible");
        svg_on.style.cursor = "pointer";
        this.button_svg.appendChild(svg_off);
        this.button_svg.appendChild(svg_on);
        this.svg_element[name] = [svg_on, svg_off];
        this.states[name] = state;
        const set_display = (state) => {
            svg_on.setAttribute("display", state ? "block" : "none");
            svg_off.setAttribute("display", state ? "none" : "block");
        };
        set_display(this.states[name]);
        const update_state = (state, redraw = true) => {
            this.states[name] = state;
            callback(this.states[name], redraw);
            set_display(this.states[name]);
        };
        svg_on.onclick = (e) => {
            e.preventDefault();
            update_state(false);
        };
        svg_off.onclick = (e) => {
            e.preventDefault();
            update_state(true);
        };
        svg_on.ontouchstart = (e) => {
            e.preventDefault();
            this.touchdownName = name;
        };
        svg_off.ontouchstart = (e) => {
            e.preventDefault();
            this.touchdownName = name;
        };
        svg_on.ontouchend = () => {
            if (this.touchdownName == name)
                update_state(false);
            this.touchdownName = null;
        };
        svg_off.ontouchend = () => {
            if (this.touchdownName == name)
                update_state(true);
            this.touchdownName = null;
        };
        const setter = (state) => { update_state(state, false); };
        return setter;
    }
    /** add a new click button if it doesn't exist, otherwise, update diagrams and callback */
    try_add_click(name, diagram, diagram_pressed, callback) {
        if (this.svg_element[name] != undefined) {
            // delete the old button
            let [old_svg_normal, old_svg_pressed] = this.svg_element[name];
            old_svg_normal.remove();
            old_svg_pressed.remove();
        }
        this.add_click(name, diagram, diagram_pressed, callback);
    }
    // TODO: handle touch input moving out of the button
    add_click(name, diagram, diagram_pressed, callback) {
        let svg_normal = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        f_draw_to_svg(svg_normal, diagram, true, calculate_text_scale(this.diagram_svg));
        svg_normal.setAttribute("overflow", "visible");
        svg_normal.style.cursor = "pointer";
        let svg_pressed = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        f_draw_to_svg(svg_pressed, diagram_pressed, true, calculate_text_scale(this.diagram_svg));
        svg_pressed.setAttribute("overflow", "visible");
        svg_pressed.style.cursor = "pointer";
        this.button_svg.appendChild(svg_normal);
        this.button_svg.appendChild(svg_pressed);
        this.svg_element[name] = [svg_normal, svg_pressed];
        const set_display = (pressed) => {
            svg_pressed.setAttribute("display", pressed ? "block" : "none");
            svg_normal.setAttribute("display", pressed ? "none" : "block");
        };
        set_display(false);
        svg_normal.onmousedown = (e) => {
            e.preventDefault();
            this.touchdownName = name;
            set_display(true);
        };
        svg_normal.onmouseup = (e) => {
            e.preventDefault();
            this.touchdownName = null;
        };
        svg_pressed.onmouseleave = (_e) => { set_display(false); };
        svg_pressed.onmousedown = (e) => {
            e.preventDefault();
            this.touchdownName = name;
        };
        svg_pressed.onmouseup = (_e) => {
            if (this.touchdownName == name)
                callback();
            this.touchdownName = null;
            set_display(false);
        };
        svg_normal.ontouchstart = (e) => {
            e.preventDefault();
            this.touchdownName = name;
            set_display(true);
        };
        svg_normal.ontouchend = (_e) => {
            if (this.touchdownName == name)
                callback();
            this.touchdownName = null;
            set_display(false);
        };
        svg_pressed.ontouchstart = (e) => {
            e.preventDefault();
            this.touchdownName = name;
            set_display(true);
        };
        svg_pressed.ontouchend = (_e) => {
            if (this.touchdownName == name)
                callback();
            this.touchdownName = null;
            set_display(false);
        };
    }
}

/**
 * convert a function that modifies a path of a diagram to a function that modifies a diagram
 * if the diagram is a polygon or curve, the function is applied directly to the diagram
 * if the diagram is a diagram, the function is recursively applied to all children
 * if the diagram is empty or text, the function is not applied
 * @param func function that modifies a path of a diagram
*/
function function_handle_path_type(func) {
    function modified_func(d) {
        if (d.type == DiagramType.Polygon || d.type == DiagramType.Curve) {
            // apply directly
            return func(d);
        }
        else if (d.type == DiagramType.Diagram) {
            // recursively apply to all children
            d.children = d.children.map(c => modified_func(c));
            return d;
        }
        else if (d.type == DiagramType.Text || d.type == DiagramType.MultilineText) {
            // do nothing
            return d;
        }
        else {
            throw new Error("Unreachable, unknown diagram type : " + d.type);
        }
    }
    return modified_func;
}
/**
 * Resample a diagram so that it has `n` points
 * @param n number of points
 * @returns function that modifies a diagram
 */
function resample(n) {
    // TODO : this function uses Diagram.parametric_point,
    // which might be slow for large n
    // for performance reason, we might want to implement it directly by calculating
    // the points of the path here
    function func(d) {
        if (d.path == undefined)
            return d;
        let ts = (d.type == DiagramType.Curve) ? linspace(0, 1, n) : linspace_exc(0, 1, n);
        let new_points = ts.map(t => d.parametric_point(t));
        d.path = new Path(new_points);
        return d;
    }
    return function_handle_path_type(func);
}
/**
 * Subdivide each segment of a diagram into n segments
 * @param n number of segments to subdivide each segment into
 * @returns function that modifies a diagram
 */
function subdivide(n = 100) {
    function func(d) {
        if (d.path == undefined)
            return d;
        let new_points = [];
        for (let i = 0; i < d.path.points.length; i++) {
            let curr_i = i;
            let next_i = (curr_i + 1) % d.path.points.length;
            let curr_p = d.path.points[i];
            let next_p = d.path.points[next_i];
            let xs = linspace(curr_p.x, next_p.x, n + 1);
            let ys = linspace(curr_p.y, next_p.y, n + 1);
            let subdivide_points = xs.map((x, i) => V2$5(x, ys[i]));
            // ignore the last point
            subdivide_points.pop();
            new_points = new_points.concat(subdivide_points);
        }
        d.path = new Path(new_points);
        return d;
    }
    return function_handle_path_type(func);
}
/**
 * Get a slice of a diagram from `t_start` to `t_end`
 * @param t_start starting point of the slice
 * @param t_end ending point of the slice
 * @param n number of points in the slice
 * @returns function that modifies a diagram
 */
function slicepath(t_start, t_end, n = 100) {
    if (t_start > t_end)
        [t_start, t_end] = [t_end, t_start];
    if (t_start < 0)
        t_start = 0;
    if (t_end > 1)
        t_end = 1;
    let n_total = Math.floor(n / (t_end - t_start));
    function func(d) {
        if (d.path == undefined)
            return d;
        let dnew = d.apply(resample(n_total));
        if (dnew.path == undefined)
            return d;
        // take slice of the path
        let new_points = dnew.path.points.slice(Math.floor(t_start * n_total), Math.floor(t_end * n_total) + 1);
        dnew.path = new Path(new_points);
        return dnew;
    }
    return function_handle_path_type(func);
}
function get_round_corner_arc_points(radius, points, count) {
    let [p1, p2, p3] = points;
    let v1 = p1.sub(p2).normalize();
    let v3 = p3.sub(p2).normalize();
    let corner_angle = Math.abs((v1.angle() - v3.angle()) % Math.PI);
    let s_dist = radius / Math.tan(corner_angle / 2);
    // s_dist can only be as long as half the distance to the closest point
    let d1 = p1.sub(p2).length();
    let d3 = p3.sub(p2).length();
    // recalculate
    s_dist = Math.min(s_dist, d1 / 2, d3 / 2);
    radius = s_dist * Math.tan(corner_angle / 2);
    let pa = p2.add(v1.scale(s_dist));
    let pb = p2.add(v3.scale(s_dist));
    let distc = Math.sqrt(radius * radius + s_dist * s_dist);
    let pc = p2.add(v1.add(v3).normalize().scale(distc));
    let angle_a = pa.sub(pc).angle();
    let angle_b = pb.sub(pc).angle();
    // if we just use angle_a and angle_b as is, the arc might be drawn in the wrong direction
    // find out which direction is the correct one
    // check whether angle_a is closer to angle_b, angle_b + 2π, or angle_b - 2π
    let angle_b_plus = angle_b + 2 * Math.PI;
    let angle_b_minus = angle_b - 2 * Math.PI;
    let angle_a_b = Math.abs(angle_a - angle_b);
    let angle_a_b_plus = Math.abs(angle_a - angle_b_plus);
    let angle_a_b_minus = Math.abs(angle_a - angle_b_minus);
    if (angle_a_b_plus < angle_a_b)
        angle_b = angle_b_plus;
    if (angle_a_b_minus < angle_a_b)
        angle_b = angle_b_minus;
    let arc_points = linspace(angle_a, angle_b, count).map(a => pc.add(Vdir(a).scale(radius)));
    return arc_points;
}
/**
 * Create a function that modifies a diagram by rounding the corners of a polygon or curve
 * @param radius radius of the corner
 * @param point_indices indices of the points to be rounded
 * @returns function that modifies a diagram
 *
 * @example
 * ```javascript
 * let s = square(5).apply(mod.round_corner(2, [0,2]))
 * ```
 */
function round_corner(radius = 1, point_indices, count = 40) {
    // if radius is a number, create an array of length one
    if (typeof radius == "number")
        radius = [radius];
    // create a function that modify the path of a diagram, (only works for polygon and curve)
    // later we will convert it to a function that modifies any diagram using function_handle_path_type
    function func(d) {
        if (d.path == undefined)
            return d;
        let diagram_point_indices = range(0, d.path.points.length);
        if (point_indices == undefined)
            point_indices = diagram_point_indices;
        // filter only the points that are in diagram_point_indices
        point_indices = point_indices.filter(i => diagram_point_indices.includes(i));
        // repeat the radius array to match the number of points
        radius = array_repeat(radius, point_indices.length);
        let new_points = [];
        for (let i = 0; i < d.path.points.length; i++) {
            let curr_i = i;
            if (!point_indices.includes(curr_i)) {
                new_points.push(d.path.points[i]);
                continue;
            }
            let prev_i = (curr_i - 1 + d.path.points.length) % d.path.points.length;
            let next_i = (curr_i + 1) % d.path.points.length;
            let prev_p = d.path.points[prev_i];
            let curr_p = d.path.points[i];
            let next_p = d.path.points[next_i];
            let arc_points = get_round_corner_arc_points(radius[point_indices.indexOf(curr_i)], [prev_p, curr_p, next_p], count);
            new_points = new_points.concat(arc_points);
        }
        d.path = new Path(new_points);
        return d;
    }
    return function_handle_path_type(func);
}
/**
 * Add an arrow to the end of a curve
 * Make sure the diagram this modifier is applied to is a curve
 * @param headsize size of the arrow head
 * @param flip flip the arrow position
 */
function add_arrow(headsize, flip = false) {
    function func(c) {
        if (c.path == undefined)
            return c;
        let p1 = flip ? c.path.points[0] : c.path.points[c.path.points.length - 1];
        let p0 = flip ? c.path.points[1] : c.path.points[c.path.points.length - 2];
        let arrow = arrow1(p0, p1, headsize);
        return diagram_combine(c, arrow).clone_style_from(c);
    }
    return function_handle_path_type(func);
}
function arrowhead_angle(d) {
    var _a;
    if (!d.contain_tag(TAG.ARROW_HEAD))
        return NaN;
    let points = (_a = d.path) === null || _a === void 0 ? void 0 : _a.points;
    if (points == undefined)
        return NaN;
    if (points.length != 3)
        return NaN;
    let v_tip = points[0];
    let v_base1 = points[1];
    let v_base2 = points[2];
    let v_base = v_base1.add(v_base2).scale(0.5);
    let v_dir = v_tip.sub(v_base);
    return v_dir.angle();
}
/**
* Replace arrowhead inside a diagram with another diagram
* @param new_arrowhead diagram to replace the arrowhead with
* The arrow will be rotated automatically,
* The default direction is to the right (+x) with the tip at the origin
*/
function arrowhead_replace(new_arrowhead) {
    return function func(d) {
        return d.apply_to_tagged_recursive(TAG.ARROW_HEAD, (arrowhead) => {
            let angle = arrowhead_angle(arrowhead);
            return new_arrowhead.copy().rotate(angle).position(arrowhead.origin);
        });
    };
}

var modifier = /*#__PURE__*/Object.freeze({
    __proto__: null,
    add_arrow: add_arrow,
    arrowhead_replace: arrowhead_replace,
    resample: resample,
    round_corner: round_corner,
    slicepath: slicepath,
    subdivide: subdivide
});

let default_axes_options = {
    // bbox   : [V2(-100,-100), V2(100,100)],
    bbox: undefined,
    xrange: [-2, 2],
    yrange: [-2, 2],
    xticks: undefined,
    yticks: undefined,
    n_sample: 100,
    ticksize: 0.1,
    headsize: 0.05,
    tick_label_offset: 0,
};
function axes_transform(axes_options) {
    let opt = Object.assign(Object.assign({}, default_axes_options), axes_options); // use default if not defined
    if (opt.bbox == undefined) {
        // get values from xrange and yrange
        let [xmin, xmax] = opt.xrange;
        let [ymin, ymax] = opt.yrange;
        opt.bbox = [V2$5(xmin, ymin), V2$5(xmax, ymax)];
    }
    let [lowerleft, upperright] = opt.bbox;
    let [xmin, xmax] = opt.xrange;
    let [ymin, ymax] = opt.yrange;
    return function (v) {
        let x = lowerleft.x + (v.x - xmin) / (xmax - xmin) * (upperright.x - lowerleft.x);
        let y = lowerleft.y + (v.y - ymin) / (ymax - ymin) * (upperright.y - lowerleft.y);
        return V2$5(x, y);
    };
}
let ax = axes_transform;
/**
 * Draw xy axes without ticks
 * @param axes_options options for the axes
 * example: opt = {
 *    bbox   : [V2(-100,-100), V2(100,100)],
 * }
 * @returns a Diagram object
 */
function axes_empty(axes_options) {
    let opt = Object.assign(Object.assign({}, default_axes_options), axes_options); // use default if not defined
    if (opt.bbox == undefined) {
        // get values from xrange and yrange
        let [xmin, xmax] = opt.xrange;
        let [ymin, ymax] = opt.yrange;
        opt.bbox = [V2$5(xmin, ymin), V2$5(xmax, ymax)];
    }
    let [lowerleft, upperright] = opt.bbox;
    // get the intersection point
    let xorigin = lowerleft.x + (upperright.x - lowerleft.x) / (opt.xrange[1] - opt.xrange[0]) * (0 - opt.xrange[0]);
    let yorigin = lowerleft.y + (upperright.y - lowerleft.y) / (opt.yrange[1] - opt.yrange[0]) * (0 - opt.yrange[0]);
    let xaxis = arrow2(V2$5(lowerleft.x, yorigin), V2$5(upperright.x, yorigin), opt.headsize).append_tags(TAG.GRAPH_AXIS);
    let yaxis = arrow2(V2$5(xorigin, lowerleft.y), V2$5(xorigin, upperright.y), opt.headsize).append_tags(TAG.GRAPH_AXIS);
    return diagram_combine(xaxis, yaxis).stroke('gray').fill('gray');
    // return xaxis;
}
/**
 * Draw xy corner axes without ticks
 * @param axes_options options for the axes
 * example: opt = {
 *    bbox   : [V2(-100,-100), V2(100,100)],
 * }
 * @returns a Diagram object
 */
function axes_corner_empty(axes_options) {
    let opt = Object.assign(Object.assign({}, default_axes_options), axes_options); // use default if not defined
    if (opt.bbox == undefined) {
        // get values from xrange and yrange
        let [xmin, xmax] = opt.xrange;
        let [ymin, ymax] = opt.yrange;
        opt.bbox = [V2$5(xmin, ymin), V2$5(xmax, ymax)];
    }
    let [lowerleft, upperright] = opt.bbox;
    // get the intersection point
    let xaxis = arrow1(lowerleft, V2$5(upperright.x, lowerleft.y), opt.headsize).append_tags(TAG.GRAPH_AXIS);
    let yaxis = arrow1(lowerleft, V2$5(lowerleft.x, upperright.y), opt.headsize).append_tags(TAG.GRAPH_AXIS);
    return diagram_combine(xaxis, yaxis).stroke('gray').fill('gray');
    // return xaxis;
}
/**
 * Draw xy corner axes without ticks and with break mark in x axis
 * @param axes_options options for the axes
 */
function axes_corner_empty_xbreak(axes_options) {
    let opt = Object.assign(Object.assign({}, default_axes_options), axes_options); // use default if not defined
    if (opt.bbox == undefined) {
        // get values from xrange and yrange
        let [xmin, xmax] = opt.xrange;
        let [ymin, ymax] = opt.yrange;
        opt.bbox = [V2$5(xmin, ymin), V2$5(xmax, ymax)];
    }
    let [lowerleft, upperright] = opt.bbox;
    // get the intersection point
    let xbreak_ysize_ = opt.ticksize * 2;
    if (opt.xticks == undefined) {
        opt.xticks = get_tick_numbers(opt.xrange[0], opt.xrange[1], false);
        opt.xticks = opt.xticks.filter(x => x > opt.xrange[0] && x < opt.xrange[1]);
    }
    let xbreak_xsize = (opt.xticks[1] - opt.xticks[0]) / 2;
    let xbreak_xpos = opt.xticks[0] - xbreak_xsize;
    let trans_f = axes_transform(opt);
    // suffix _ means in the transformed coordinate
    let xbreak_pleft_ = trans_f(V2$5(xbreak_xpos - xbreak_xsize / 2, 0));
    let xbreak_pright_ = trans_f(V2$5(xbreak_xpos + xbreak_xsize / 2, 0));
    let xbreak_xsize_ = xbreak_pright_.x - xbreak_pleft_.x;
    let xbreak_pbottom_ = xbreak_pleft_.add(V2$5(xbreak_xsize_ * 1 / 3, -xbreak_ysize_ / 2));
    let xbreak_ptop_ = xbreak_pleft_.add(V2$5(xbreak_xsize_ * 2 / 3, xbreak_ysize_ / 2));
    let xbreak_curve = curve([xbreak_pleft_, xbreak_pbottom_, xbreak_ptop_, xbreak_pright_]);
    let xaxis_left = line$1(lowerleft, xbreak_pleft_);
    let xaxis_right = arrow1(xbreak_pright_, V2$5(upperright.x, lowerleft.y), opt.headsize);
    let xaxis = diagram_combine(xaxis_left, xbreak_curve, xaxis_right).append_tags(TAG.GRAPH_AXIS);
    let yaxis = arrow1(lowerleft, V2$5(lowerleft.x, upperright.y), opt.headsize).append_tags(TAG.GRAPH_AXIS);
    return diagram_combine(xaxis, yaxis).stroke('gray').fill('gray');
}
/**
 * Create a single tick mark in the x axis
 * @param x x coordinate of the tick mark
 * @param y y coordinate of the tick mark
 * @param height height of the tick mark
 */
function xtickmark_empty(x, y, axes_options) {
    let opt = Object.assign(Object.assign({}, default_axes_options), axes_options); // use default if not defined
    let height = opt.ticksize;
    let pos = axes_transform(opt)(V2$5(x, y));
    return line$1(V2$5(pos.x, pos.y + height / 2), V2$5(pos.x, pos.y - height / 2))
        .stroke('gray').append_tags(TAG.GRAPH_TICK);
}
function xtickmark(x, y, str, axes_options) {
    let tick = xtickmark_empty(x, y, axes_options);
    let label = textvar(str).move_origin_text("top-center").translate(tick.get_anchor("bottom-center"))
        .translate(V2$5(0, -((axes_options === null || axes_options === void 0 ? void 0 : axes_options.tick_label_offset) || 0)))
        .textfill('gray').append_tags(TAG.GRAPH_TICK_LABEL);
    return diagram_combine(tick, label);
}
/**
 * Create a single tick mark in the y axis
 * @param y y coordinate of the tick mark
 * @param x x coordinate of the tick mark
 * @param height height of the tick mark
 */
function ytickmark_empty(y, x, axes_options) {
    let opt = Object.assign(Object.assign({}, default_axes_options), axes_options); // use default if not defined
    let height = opt.ticksize;
    let pos = axes_transform(opt)(V2$5(x, y));
    return line$1(V2$5(pos.x + height / 2, pos.y), V2$5(pos.x - height / 2, pos.y))
        .stroke('gray').append_tags(TAG.GRAPH_TICK);
}
function ytickmark(y, x, str, axes_options) {
    let tick = ytickmark_empty(y, x, axes_options);
    let label = textvar(str).move_origin_text("center-right").translate(tick.get_anchor("center-left"))
        .translate(V2$5(-((axes_options === null || axes_options === void 0 ? void 0 : axes_options.tick_label_offset) || 0), 0))
        .textfill('gray').append_tags(TAG.GRAPH_TICK_LABEL);
    return diagram_combine(tick, label);
}
// ======= BEGIN utility to calculate ticks
function get_tick_interval(min, max) {
    let range = max - min;
    let range_order = Math.floor(Math.log10(range));
    let interval_to_try = [0.1, 0.15, 0.2, 0.5, 1.0].map(x => x * Math.pow(10, range_order));
    let tick_counts = interval_to_try.map(x => Math.floor(range / x));
    // choose the interval so that the number of ticks is between the biggest one but less than 10
    for (let i = 0; i < tick_counts.length; i++) {
        if (tick_counts[i] <= 10) {
            return interval_to_try[i];
        }
    }
    return interval_to_try.slice(-1)[0];
}
function get_tick_numbers_range(min, max) {
    let interval = get_tick_interval(min, max);
    // round min and max to the nearest interval
    let new_min = Math.round(min / interval) * interval;
    let new_max = Math.round(max / interval) * interval;
    let new_count = Math.round((new_max - new_min) / interval);
    let l = range_inc(0, new_count).map(x => new_min + x * interval);
    // round l to the nearest interval
    let interval_prec = -Math.floor(Math.log10(interval) - 1);
    if (interval_prec >= 0)
        l = l.map(x => parseFloat(x.toFixed(interval_prec)));
    return l;
}
function get_tick_numbers_aroundzero(neg, pos, nozero = true) {
    if (neg > 0)
        throw new Error('neg must be negative');
    if (pos < 0)
        throw new Error('pos must be positive');
    let magnitude = Math.max(-neg, pos);
    let interval = get_tick_interval(-magnitude, magnitude);
    // round min and max to the nearest interval
    let new_min = Math.ceil(neg / interval) * interval;
    let new_max = Math.floor(pos / interval) * interval;
    let new_count = Math.floor((new_max - new_min) / interval);
    let l = linspace(new_min, new_max, new_count + 1);
    // round l to the nearest interval
    let interval_prec = -Math.floor(Math.log10(interval));
    if (interval_prec >= 0)
        l = l.map(x => parseFloat(x.toFixed(interval_prec)));
    if (nozero) {
        return l.filter(x => x != 0);
    }
    else {
        return l;
    }
}
function get_tick_numbers(min, max, exclude_zero = true) {
    if (exclude_zero && min < 0 && max > 0) {
        return get_tick_numbers_aroundzero(min, max);
    }
    else {
        return get_tick_numbers_range(min, max);
    }
}
// ======= END utility to calculate ticks
function xticks(axes_options, y = 0, empty = false) {
    let opt = Object.assign(Object.assign({}, default_axes_options), axes_options); // use default if not defined
    if (opt.xticks == undefined) {
        opt.xticks = get_tick_numbers(opt.xrange[0], opt.xrange[1], y == 0);
    }
    // remove ticks outside of the range
    // opt.xticks = opt.xticks.filter(x => x >= opt.xrange[0] && x <= opt.xrange[1]);
    opt.xticks = opt.xticks.filter(x => x > opt.xrange[0] && x < opt.xrange[1]);
    let xticks_diagrams = empty ?
        opt.xticks.map(x => xtickmark_empty(x, y, opt)) :
        opt.xticks.map(x => xtickmark(x, y, x.toString(), opt));
    return diagram_combine(...xticks_diagrams);
}
function yticks(axes_options, x = 0, empty = false) {
    let opt = Object.assign(Object.assign({}, default_axes_options), axes_options); // use default if not defined
    if (opt.yticks == undefined) {
        opt.yticks = get_tick_numbers(opt.yrange[0], opt.yrange[1], x == 0);
    }
    // remove ticks outside of the range
    // opt.yticks = opt.yticks.filter(y => y >= opt.yrange[0] && y <= opt.yrange[1]);
    opt.yticks = opt.yticks.filter(y => y > opt.yrange[0] && y < opt.yrange[1]);
    let yticks_diagrams = empty ?
        opt.yticks.map(y => ytickmark_empty(y, x, opt)) :
        opt.yticks.map(y => ytickmark(y, x, y.toString(), opt));
    return diagram_combine(...yticks_diagrams);
}
/**
 * Draw xy corner axes with ticks
 * @param axes_options options for the axes
 */
function xycorneraxes(axes_options) {
    let opt = Object.assign(Object.assign({}, default_axes_options), axes_options); // use default if not defined
    let xmin = opt.xrange[0];
    let ymin = opt.yrange[0];
    return diagram_combine(axes_corner_empty(opt), xticks(opt, ymin), yticks(opt, xmin));
}
/**
 * Draw xy corner axes with ticks and break mark in x axis
 * @param axes_options options for the axes
 */
function xycorneraxes_xbreak(axes_options) {
    let opt = Object.assign(Object.assign({}, default_axes_options), axes_options); // use default if not defined
    let xmin = opt.xrange[0];
    let ymin = opt.yrange[0];
    return diagram_combine(axes_corner_empty_xbreak(opt), xticks(opt, ymin), yticks(opt, xmin));
}
/**
 * Draw xy axes with ticks
 * @param axes_options options for the axes
 */
function xyaxes(axes_options) {
    let opt = Object.assign(Object.assign({}, default_axes_options), axes_options); // use default if not defined
    return diagram_combine(axes_empty(opt), xticks(opt), yticks(opt));
}
/**
 * Draw x axis with ticks
 * @param axes_options options for the axis
 */
function xaxis(axes_options) {
    let opt = Object.assign(Object.assign({}, default_axes_options), axes_options); // use default if not defined
    if (opt.bbox == undefined) {
        // get values from xrange and yrange
        let [xmin, xmax] = opt.xrange;
        let [ymin, ymax] = opt.yrange;
        opt.bbox = [V2$5(xmin, ymin), V2$5(xmax, ymax)];
    }
    let ax_origin = axes_transform(opt)(V2$5(0, 0));
    let xaxis = arrow2(V2$5(opt.bbox[0].x, ax_origin.y), V2$5(opt.bbox[1].x, ax_origin.y), opt.headsize)
        .append_tags(TAG.GRAPH_AXIS);
    let xtickmarks = xticks(opt, 0);
    return diagram_combine(xaxis, xtickmarks);
}
/**
 * Draw y axis with ticks
 * @param axes_options options for the axis
 */
function yaxis(axes_options) {
    let opt = Object.assign(Object.assign({}, default_axes_options), axes_options); // use default if not defined
    if (opt.bbox == undefined) {
        // get values from xrange and yrange
        let [xmin, xmax] = opt.xrange;
        let [ymin, ymax] = opt.yrange;
        opt.bbox = [V2$5(xmin, ymin), V2$5(xmax, ymax)];
    }
    let ax_origin = axes_transform(opt)(V2$5(0, 0));
    let yaxis = arrow2(V2$5(ax_origin.x, opt.bbox[0].y), V2$5(ax_origin.x, opt.bbox[1].y), opt.headsize)
        .append_tags(TAG.GRAPH_AXIS);
    let ytickmarks = yticks(opt, 0);
    return diagram_combine(yaxis, ytickmarks);
}
function ygrid(axes_options) {
    let opt = Object.assign(Object.assign({}, default_axes_options), axes_options); // use default if not defined
    if (opt.xticks == undefined) {
        opt.xticks = get_tick_numbers(opt.xrange[0], opt.xrange[1], false);
    }
    let ygrid_diagrams = opt.xticks.map(x => line$1(V2$5(x, opt.yrange[0]), V2$5(x, opt.yrange[1])).transform(axes_transform(opt)).stroke('gray'));
    return diagram_combine(...ygrid_diagrams).append_tags(TAG.GRAPH_GRID);
}
function xgrid(axes_options) {
    let opt = Object.assign(Object.assign({}, default_axes_options), axes_options); // use default if not defined
    if (opt.yticks == undefined) {
        opt.yticks = get_tick_numbers(opt.yrange[0], opt.yrange[1], false);
    }
    let xgrid_diagrams = opt.yticks.map(y => line$1(V2$5(opt.xrange[0], y), V2$5(opt.xrange[1], y)).transform(axes_transform(opt)).stroke('gray'));
    return diagram_combine(...xgrid_diagrams).append_tags(TAG.GRAPH_GRID);
}
//  TODO: add xticks and ytiks as argument
function xygrid(axes_options) {
    let opt = Object.assign(Object.assign({}, default_axes_options), axes_options); // use default if not defined
    if (opt.xticks == undefined) {
        opt.xticks = get_tick_numbers(opt.xrange[0], opt.xrange[1], false);
    }
    if (opt.yticks == undefined) {
        opt.yticks = get_tick_numbers(opt.yrange[0], opt.yrange[1], false);
    }
    let xgrid_diagrams = opt.xticks.map(x => line$1(V2$5(x, opt.yrange[0]), V2$5(x, opt.yrange[1])).transform(axes_transform(opt)).stroke('gray'));
    let ygrid_diagrams = opt.yticks.map(y => line$1(V2$5(opt.xrange[0], y), V2$5(opt.xrange[1], y)).transform(axes_transform(opt)).stroke('gray'));
    return diagram_combine(...xgrid_diagrams, ...ygrid_diagrams);
}
// TODO : 
// export function axes(axes_options? : Partial<axes_options>) : Diagram {
//     let opt = {...default_axes_options, ...axes_options}; // use default if not defined
// }
/**
 * Plot a curve given a list of points
 * @param data list of points
 * @param axes_options options for the axes
 * example: opt = {
 *  bbox   : [V2(-100,-100), V2(100,100)],
 *  xrange : [-2, 2],
 *  yrange : [-2, 2],
 * }
 */
function plotv(data, axes_options) {
    let opt = Object.assign(Object.assign({}, default_axes_options), axes_options); // use default if not defined
    let [xmin, xmax] = opt.xrange;
    let [ymin, ymax] = opt.yrange;
    // split data into segments that are within the range
    let segments = [];
    let current_segment = [];
    for (let i = 0; i < data.length; i++) {
        let p = data[i];
        let is_inside = (p.x >= xmin && p.x <= xmax && p.y >= ymin && p.y <= ymax);
        if (!is_inside) {
            if (current_segment.length > 1)
                segments.push(current_segment);
            current_segment = [];
        }
        else {
            current_segment.push(p);
        }
    }
    if (current_segment.length > 1)
        segments.push(current_segment);
    let d;
    // create separate paths for each segment
    let path_diagrams = segments.map(segment => curve(segment));
    if (path_diagrams.length == 1) {
        d = path_diagrams[0];
    }
    else {
        d = diagram_combine(...path_diagrams).stroke('black').fill('none');
    }
    return d.transform(axes_transform(opt));
}
/**
 * Plot a curve given xdata and ydata
 * @param xdata x coordinates of the data
 * @param ydata y coordinates of the data
 * @param axes_options options for the axes
 * example: opt = {
 *   bbox   : [V2(-100,-100), V2(100,100)],
 *   xrange : [-2, 2],
 *   yrange : [-2, 2],
 * }
 */
function plot$1(xdata, ydata, axes_options) {
    if (xdata.length != ydata.length)
        throw new Error('xdata and ydata must have the same length');
    let vdata = xdata.map((x, i) => V2$5(x, ydata[i]));
    return plotv(vdata, axes_options);
}
/**
 * Plot a function
 * @param f function to plot
 * @param n number of points to plot
 * @param axes_options options for the axes
 */
function plotf(f, axes_options) {
    let opt = Object.assign(Object.assign({}, default_axes_options), axes_options); // use default if not defined
    let xdata = linspace(...opt.xrange, opt.n_sample);
    let vdata = xdata.map(x => V2$5(x, f(x)));
    return plotv(vdata, axes_options);
}
function under_curvef(f, x_start, x_end, axes_options) {
    let opt = Object.assign(Object.assign({}, default_axes_options), axes_options); // use default if not defined
    let new_opt = Object.assign({}, opt); // copy opt
    new_opt.xrange = [x_start, x_end];
    new_opt.bbox = undefined;
    // draw plot from x_start to x_end
    let fplot = plotf(f, new_opt);
    let area_under = fplot.add_points([V2$5(x_end, 0), V2$5(x_start, 0)]).to_polygon();
    return area_under.transform(axes_transform(opt));
}

var shapes_graph = /*#__PURE__*/Object.freeze({
    __proto__: null,
    ax: ax,
    axes_corner_empty: axes_corner_empty,
    axes_corner_empty_xbreak: axes_corner_empty_xbreak,
    axes_empty: axes_empty,
    axes_transform: axes_transform,
    default_axes_options: default_axes_options,
    get_tick_numbers: get_tick_numbers,
    plot: plot$1,
    plotf: plotf,
    plotv: plotv,
    under_curvef: under_curvef,
    xaxis: xaxis,
    xgrid: xgrid,
    xtickmark: xtickmark,
    xtickmark_empty: xtickmark_empty,
    xticks: xticks,
    xyaxes: xyaxes,
    xycorneraxes: xycorneraxes,
    xycorneraxes_xbreak: xycorneraxes_xbreak,
    xygrid: xygrid,
    yaxis: yaxis,
    ygrid: ygrid,
    ytickmark: ytickmark,
    ytickmark_empty: ytickmark_empty,
    yticks: yticks
});

/**
 * Create an annotation vector
 * @param v vector to be annotated
 * @param str string to be annotated (will be converted to mathematical italic)
 * if you don't want to convert to mathematical italic, use annotation.vector_text
 * @param arrow_head_size size of the arrow head
 * @param text_offset position offset of the text
 */
function vector(v, str, text_offset, arrow_head_size) {
    if (text_offset == undefined) {
        text_offset = V2$5(0, 0);
    } // default value
    let vec = arrow(v, arrow_head_size);
    if (str == "" || str == undefined) {
        return vec;
    } // if str is empty, return only the vector
    let txt = textvar(str).position(v.add(text_offset));
    return diagram_combine(vec, txt);
}
/**
 * Create an annotation for angle
 * @param p three points to define the angle
 * @param str string to be annotated (will be converted to mathematical italic)
 * @param radius radius of the arc
 * @param text_offset position offset of the text
 * if given as a number, the text will be placed at the angle bisector with the given distance from the vertex
 * if given as a vector, the text will be placed at the given position offset
 */
function angle(p, str, radius = 1, text_offset) {
    let [p1, p2, p3] = p;
    let va = p1.sub(p2);
    let vb = p3.sub(p2);
    if (text_offset == undefined) {
        text_offset = V2$5(0, 0);
    } // default value
    if (typeof text_offset == "number") {
        let vd = va.normalize().add(vb.normalize()).normalize().scale(text_offset);
        text_offset = vd;
    }
    let angle_a = va.angle();
    let angle_b = vb.angle();
    // angle_b must be larger than angle_a
    if (angle_b < angle_a) {
        angle_b += 2 * Math.PI;
    }
    let angle_arc = arc(radius, angle_b - angle_a).rotate(angle_a)
        .add_points([V2$5(0, 0)]).to_polygon();
    if (str == "" || str == undefined) {
        return angle_arc.position(p2);
    } // if str is empty, return only the arc
    let angle_text = textvar(str)
        .translate(text_offset);
    return diagram_combine(angle_arc, angle_text).position(p2);
}
/**
 * Create an annotation for angle (always be the smaller angle)
 * @param p three points to define the angle
 * @param str string to be annotated (will be converted to mathematical italic)
 * @param radius radius of the arc
 * @param text_offset position offset of the text
 * if given as a number, the text will be placed at the angle bisector with the given distance from the vertex
 * if given as a vector, the text will be placed at the given position offset
 */
function angle_smaller(p, str, radius = 1, text_offset) {
    let [p1, p2, p3] = p;
    let va = p1.sub(p2);
    let vb = p3.sub(p2);
    let angle_a = va.angle();
    let angle_b = vb.angle();
    // angle_b must be larger than angle_a
    if (angle_b < angle_a) {
        angle_b += 2 * Math.PI;
    }
    let dangle = angle_b - angle_a;
    // if dangle is larger than 180 degree, swap the two vectors
    let ps = dangle > Math.PI ? [p3, p2, p1] : [p1, p2, p3];
    return angle(ps, str, radius, text_offset);
}
/**
 * Create an annotation for right angle
 * make sure the angle is 90 degree
 * @param p three points to define the angle
 * @param size size of the square
 */
function right_angle(p, size = 1) {
    let [p1, p2, p3] = p;
    let p1_ = p1.sub(p2).normalize().scale(size).add(p2);
    let p3_ = p3.sub(p2).normalize().scale(size).add(p2);
    let p2_ = V2$5(p1_.x, p3_.y);
    return curve([p1_, p2_, p3_]);
}
function length(p1, p2, str, offset, tablength, textoffset, tabsymmetric = true) {
    // setup defaults
    tablength = tablength !== null && tablength !== void 0 ? tablength : p2.sub(p1).length() / 20;
    textoffset = textoffset !== null && textoffset !== void 0 ? textoffset : offset * 2;
    let v = p1.equals(p2) ? V2$5(0, 0) : p2.sub(p1).normalize();
    let n = V2$5(v.y, -v.x);
    let pA = p1.add(n.scale(offset));
    let pB = p2.add(n.scale(offset));
    let tabA = tabsymmetric ?
        line$1(pA.sub(n.scale(tablength / 2)), pA.add(n.scale(tablength / 2))) :
        line$1(pA, pA.sub(n.scale(tablength)));
    let tabB = tabsymmetric ?
        line$1(pB.sub(n.scale(tablength / 2)), pB.add(n.scale(tablength / 2))) :
        line$1(pB, pB.sub(n.scale(tablength)));
    let lineAB = line$1(pA, pB);
    let lines = diagram_combine(lineAB, tabA, tabB);
    let pmid = p1.add(p2).scale(0.5);
    let label = textvar(str).position(pmid.add(n.scale(textoffset)));
    return diagram_combine(lines, label);
}
/**
 * Create a congruence mark
 * @param p1 start point of the line
 * @param p2 end point of the line
 * @param count number of marks
 * @param size size of the mark
 * @param gap gap between the marks
 */
function congruence_mark(p1, p2, count, size = 1, gap) {
    let v = p2.sub(p1);
    let n_angle = Math.atan2(v.x, -v.y);
    let p_mid = p1.add(p2).scale(0.5);
    gap = gap !== null && gap !== void 0 ? gap : size / 2;
    let marks = [];
    for (let i = 0; i < count; i++) {
        let l = line$1(V2$5(-size / 2, i * gap), V2$5(size / 2, i * gap));
        marks.push(l);
    }
    let dg_marks = diagram_combine(...marks);
    return dg_marks.rotate(n_angle).move_origin('center-center').position(p_mid);
}
/**
 * Create a parallel mark
 * @param p1 start point of the line
 * @param p2 end point of the line
 * @param count number of marks
 * @param size size of the mark
 * @param gap gap between the marks
 * @param arrow_angle angle of the arrow
 */
function parallel_mark(p1, p2, count, size = 1, gap, arrow_angle = 0.5) {
    let v = p2.sub(p1);
    let n_angle = Math.atan2(v.x, -v.y);
    let p_mid = p1.add(p2).scale(0.5);
    gap = gap !== null && gap !== void 0 ? gap : size / 2;
    let marks = [];
    let dy = size / 2 * Math.cos(arrow_angle);
    for (let i = 0; i < count; i++) {
        let p0 = V2$5(0, i * gap - dy);
        let l1 = line$1(V2$5(-size / 2, i * gap), p0);
        let l2 = line$1(V2$5(size / 2, i * gap), p0);
        marks.push(l1.combine(l2));
    }
    let dg_marks = diagram_combine(...marks);
    return dg_marks.rotate(n_angle).move_origin('center-center').position(p_mid);
}

var shapes_annotation = /*#__PURE__*/Object.freeze({
    __proto__: null,
    angle: angle,
    angle_smaller: angle_smaller,
    congruence_mark: congruence_mark,
    length: length,
    parallel_mark: parallel_mark,
    right_angle: right_angle,
    vector: vector
});

/**
 * Create an inclined plane.
 * @param length The length of the inclined plane.
 * @param angle The angle of the inclined plane.
 * @returns A diagram of the inclined plane.
 */
function inclined_plane(length, angle) {
    return polygon([V2$5(0, 0), V2$5(length, length * Math.tan(angle)), V2$5(length, 0)]);
}
/**
 * Create a spring between two points.
 * @param p1 The first point.
 * @param p2 The second point.
 * @param radius The radius of the spring.
 * @param coil_number The number of coils in the spring.
 * @param separation_coefficient The coefficient of separation between coils.
 * \* at 0, no coils are overlapping. (there is no max value)
 * @param sample_number The number of points to sample in the spring.
 * @returns A diagram of the spring.
 */
function spring(p1, p2, radius = 1, coil_number = 10, separation_coefficient = 0.5, sample_number = 100) {
    // I got this equation from https://www.reddit.com/r/desmos/comments/i3m3yd/interactive_spring_graphic/
    let angle = p2.sub(p1).angle();
    let length = p2.sub(p1).length();
    // abbrev
    let R = separation_coefficient;
    let n = coil_number;
    let k = radius / R; // k*R = radius
    let a = (2 * n + 1) * Math.PI;
    let b = (length - 2 * R) / a;
    let parametric_function = (t) => V2$5(b * t + R - R * Math.cos(t), k * R * Math.sin(t));
    let points = linspace(0, a, sample_number).map(parametric_function);
    return curve(points).rotate(angle).translate(p1);
}

var shapes_mechanics = /*#__PURE__*/Object.freeze({
    __proto__: null,
    inclined_plane: inclined_plane,
    spring: spring
});

let default_bar_options$1 = {
    gap: 0.1,
    ticksize: 0.2,
    bbox: [V2$5(0, 0), V2$5(10, 10)],
};
function to_ax_options$1(datavalues, baropt) {
    var _a, _b;
    let opt = Object.assign(Object.assign({}, default_bar_options$1), baropt); // use default if not defined
    let n = datavalues.length;
    let ymax = Math.max(...datavalues);
    let yrange = (_a = opt.yrange) !== null && _a !== void 0 ? _a : [0, ymax];
    let bbox = (_b = opt.bbox) !== null && _b !== void 0 ? _b : [V2$5(0, 0), V2$5(10, ymax)];
    let ax_opt = {
        xrange: [-1, n],
        yrange: yrange,
        headsize: 0,
        ticksize: opt.ticksize,
        bbox: bbox,
    };
    return ax_opt;
}
/**
 * Plot a bar chart
 * @param datavalues the data values to plot
 * @param bar_options options for the bar chart
 * @returns a diagram of the bar chart
 */
function plot(datavalues, bar_options = {}) {
    let opt = Object.assign(Object.assign({}, default_bar_options$1), bar_options); // use default if not defined
    let ax_opt = to_ax_options$1(datavalues, opt);
    let ax_f = axes_transform(ax_opt);
    let bar_arr = datavalues.map((y, i) => rectangle(1.0 - opt.gap, y).move_origin('bottom-center')
        .position(V2$5(Number(i), 0)).transform(ax_f));
    return diagram_combine(...bar_arr);
}
/**
 * x-axes with label for bar chart
 * @param datanames the data names
 * @param bar_options options for the bar chart
 * @returns a diagram of the x-axes
 */
function xaxes(datanames, bar_options = {}) {
    let opt = Object.assign(Object.assign({}, default_bar_options$1), bar_options); // use default if not defined
    let n = datanames.length;
    let ax_opt = to_ax_options$1(datanames.map(() => 1), opt);
    let ax_f = axes_transform(ax_opt);
    let l = line$1(V2$5(-1, 0), V2$5(n, 0)).transform(ax_f).stroke('gray');
    let label_arr = datanames.map((name, i) => text(name).move_origin_text('top-center').position(V2$5(Number(i), 0)).transform(ax_f)
        .translate(V2$5(0, -opt.ticksize / 2)).textfill('gray'));
    return diagram_combine(l, ...label_arr);
}
/**
 * y-axes with label for bar chart
 * @param datavalues the data values
 * @param bar_options options for the bar chart
 */
function yaxes(datavalues, bar_options = {}) {
    var _a;
    let opt = Object.assign(Object.assign({}, default_bar_options$1), bar_options); // use default if not defined
    let ax_opt = to_ax_options$1(datavalues, opt);
    let ymax = ax_opt.yrange[1];
    let yrange = (_a = opt.yrange) !== null && _a !== void 0 ? _a : [0, ymax];
    let ax_f = axes_transform(ax_opt);
    let l = line$1(V2$5(-1, 0), V2$5(-1, yrange[1])).transform(ax_f).stroke('gray');
    return yticks(ax_opt, -1).combine(l);
}
function axes_tansform(datavalues, bar_options = {}) {
    let opt = Object.assign(Object.assign({}, default_bar_options$1), bar_options); // use default if not defined
    let ax_opt = to_ax_options$1(datavalues, opt);
    return axes_transform(ax_opt);
}

var shapes_bar = /*#__PURE__*/Object.freeze({
    __proto__: null,
    axes_tansform: axes_tansform,
    default_bar_options: default_bar_options$1,
    plot: plot,
    xaxes: xaxes,
    yaxes: yaxes
});

/**
 * Draw an empty axis from xmin to xmax with arrowsize
 * @param xmin minimum value of the numberline
 * @param xmax maximum value of the numberline
 * @param arrowsize the size of the arrowhead
 * returns a Diagram
 */
function axis(xmin, xmax, arrowsize = 1) {
    return arrow2(V2$5(xmin, 0), V2$5(xmax, 0), arrowsize).fill('black');
}
/**
 * Draw a numbered ticks for a numberline
 * @param xs the values of the ticks
 * @param ticksize the size of the ticks
 * @param number_offset the offset of the number from the ticks
 * returns a Diagram
 */
function numbered_ticks(xs, ticksize, number_offset) {
    let d_ticks = [];
    for (let i of xs) {
        let tick = line$1(V2$5(i, -ticksize / 2), V2$5(i, ticksize / 2)).stroke('black');
        let num = text(i.toString()).move_origin('top-center').position(V2$5(i, -ticksize / 2 - number_offset));
        d_ticks.push(diagram_combine(tick, num));
    }
    return diagram_combine(...d_ticks);
}
/**
 * Draw ticks for a numberline
 * @param xs the values of the ticks
 * @param ticksize the size of the ticks
 * returns a Diagram
 */
function ticks(xs, ticksize) {
    let d_ticks = [];
    for (let i of xs) {
        let tick = line$1(V2$5(i, -ticksize / 2), V2$5(i, ticksize / 2)).stroke('black');
        d_ticks.push(tick);
    }
    return diagram_combine(...d_ticks);
}
/**
 * Draw a single tick for a numberline
 * @param x the value of the tick
 * @param txt the text of the tick
 * @param ticksize the size of the tick
 * @param text_offset the offset of the text from the tick
 * returns a Diagram
 */
function single_tick(x, txt, ticksize, text_offset) {
    let tick = line$1(V2$5(x, -ticksize / 2), V2$5(x, ticksize / 2)).stroke('black');
    if (txt == '')
        return tick;
    let num = text(txt).move_origin('top-center').position(V2$5(x, -ticksize / 2 - text_offset));
    return diagram_combine(tick, num);
}

var shapes_numberline = /*#__PURE__*/Object.freeze({
    __proto__: null,
    axis: axis,
    numbered_ticks: numbered_ticks,
    single_tick: single_tick,
    ticks: ticks
});

var TableOrientation;
(function (TableOrientation) {
    TableOrientation["ROWS"] = "rows";
    TableOrientation["COLUMNS"] = "columns";
})(TableOrientation || (TableOrientation = {}));
/**
 * Create a table with diagrams inside
 * @param diagrams 2D array of diagrams
 * @param orientation orientation of the table (default: 'rows')
 * can be 'rows' or 'columns'
 * @param min_rowsize minimum size of each row
 * @param min_colsize minimum size of each column
 * @returns a diagram of the table with the diagrams inside
 */
function table(diagrams, padding = 0, orientation = TableOrientation.ROWS, min_rowsize = 0, min_colsize = 0) {
    // if the orientation is columns, then we just transpose the rows and columns
    let diagram_rows = orientation == TableOrientation.ROWS ? diagrams : transpose(diagrams);
    function f_size(d) {
        if (d == undefined)
            return [min_colsize, min_rowsize];
        let [bottomleft, topright] = d.bounding_box();
        let width = topright.x - bottomleft.x + 2 * padding;
        let height = topright.y - bottomleft.y + 2 * padding;
        return [width, height];
    }
    let row_count = diagram_rows.length;
    let col_count = Math.max(...diagram_rows.map(row => row.length));
    let rowsizes = Array(row_count).fill(min_rowsize);
    let colsizes = Array(col_count).fill(min_colsize);
    // find the maximum size of each row and column
    for (let r = 0; r < row_count; r++) {
        for (let c = 0; c < col_count; c++) {
            let [w, h] = f_size(diagram_rows[r][c]);
            rowsizes[r] = Math.max(rowsizes[r], h);
            colsizes[c] = Math.max(colsizes[c], w);
        }
    }
    return fixed_size(diagrams, rowsizes, colsizes, orientation);
}
/**
 * Style the cells of a table
 * @param table_diagram a diagram of a table
 * @param styles an array of cell styles
 * each style has an index of the cell and the style
 * e.g. { index : [0,0], fill : 'red', stroke : 'black', strokewidth : 2 }
 * not all styles are required
 * e.g. { index : [0,0], fill : 'red' }
 * @returns a new diagram with the cells styled
 */
function style_cell(table_diagram, styles) {
    let newd = table_diagram.copy();
    if (table_diagram.tags.includes(TAG.CONTAIN_TABLE)) {
        let table_index = newd.children.findIndex(d => d.tags.includes(TAG.TABLE));
        let new_table = style_cell(newd.children[table_index], styles);
        newd.children[table_index] = new_table;
        return newd;
    }
    else if (!table_diagram.tags.includes(TAG.TABLE)) {
        return table_diagram;
    }
    for (let style of styles) {
        let [r, c] = style.index;
        let cell = newd.children[r].children[c];
        if (style.fill) {
            cell = cell.fill(style.fill);
        }
        if (style.stroke) {
            cell = cell.stroke(style.stroke);
        }
        if (style.strokewidth) {
            cell = cell.strokewidth(style.strokewidth);
        }
        newd.children[r].children[c] = cell;
    }
    return newd;
}
/**
 * Create a table with fixed size
 * @param diagrams 2D array of diagrams
 * @param rowsizes size of each row
 * if `rowsizes.length` is less than `diagrams.length`, the last value will be repeated
 * e.g. [1,2,3] -> [1,2,3,3,3]
 * @param colsizes size of each column
 * if `colsizes.length` is less than `diagrams[0].length`, the last value will be repeated
 * @param orientation orientation of the table (default: 'rows')
 * can be 'rows' or 'columns'
 * @returns a diagram of the table with the diagrams inside
 */
function fixed_size(diagrams, rowsizes, colsizes, orientation = TableOrientation.ROWS) {
    // if the orientation is columns, then we just transpose the rows and columns
    let diagram_rows = orientation == TableOrientation.ROWS ? diagrams : transpose(diagrams);
    let row_count = diagram_rows.length;
    let col_count = Math.max(...diagram_rows.map(row => row.length));
    let table = empty_fixed_size(row_count, col_count, rowsizes, colsizes);
    let points = get_points(table);
    let diagram_grid = [];
    for (let r = 0; r < row_count; r++) {
        for (let c = 0; c < col_count; c++) {
            let d = diagram_rows[r][c];
            if (d == undefined)
                continue;
            d = d.move_origin('center-center').position(points[r][c])
                .append_tags(TAG.TABLE_CONTENT)
                .append_tags(TAG.ROW_ + r)
                .append_tags(TAG.COL_ + c);
            diagram_grid.push(d);
        }
    }
    let diagram_grid_combined = diagram_combine(...diagram_grid);
    return diagram_combine(table, diagram_grid_combined).append_tags(TAG.CONTAIN_TABLE);
}
/**
 * Create an empty table with fixed size
 * @param row_count number of rows
 * @param col_count number of columns
 * @param rowsizes size of each row
 * if `rowsizes.length` is less than `row_count`, the last value will be repeated
 * e.g. [1,2,3] -> [1,2,3,3,3]
 * @param colsizes size of each column
 * if `colsizes.length` is less than `col_count`, the last value will be repeated
 */
function empty_fixed_size(row_count, col_count, rowsizes, colsizes) {
    while (rowsizes.length < row_count) {
        rowsizes.push(rowsizes[rowsizes.length - 1]);
    }
    while (colsizes.length < col_count) {
        colsizes.push(colsizes[colsizes.length - 1]);
    }
    let rows = [];
    let y_top = 0;
    for (let r = 0; r < row_count; r++) {
        let y_bot = y_top - rowsizes[r];
        let x_left = 0;
        let cols = [];
        for (let c = 0; c < col_count; c++) {
            let x_right = x_left + colsizes[c];
            let x_mid = (x_left + x_right) / 2;
            let y_mid = (y_top + y_bot) / 2;
            //TODO: draw line instead of recangles
            let rect = rectangle_corner(V2$5(x_left, y_bot), V2$5(x_right, y_top)).move_origin(V2$5(x_mid, y_mid))
                .append_tags(TAG.TABLE_CELL)
                .append_tags(TAG.ROW_ + r)
                .append_tags(TAG.COL_ + c);
            cols.push(rect);
            x_left = x_right;
        }
        rows.push(diagram_combine(...cols));
        y_top = y_bot;
    }
    return diagram_combine(...rows).append_tags(TAG.TABLE);
}
/**
 * Get the midpoints of the cells from a table diagram
 * @param table_diagram a table diagram
 * @returns a 2D array of points
 * the first index is the row, the second index is the column
 */
function get_points(table_diagram) {
    let table_diagram_ = table_diagram;
    if (table_diagram.tags.includes(TAG.CONTAIN_TABLE)) {
        for (let d of table_diagram.children) {
            if (d.tags.includes(TAG.TABLE)) {
                table_diagram_ = d;
                break;
            }
        }
    }
    if (!table_diagram_.tags.includes(TAG.TABLE))
        return [];
    let rows = [];
    for (let row of table_diagram_.children) {
        let cols = [];
        for (let cell of row.children) {
            cols.push(cell.origin);
        }
        rows.push(cols);
    }
    return rows;
}

var shapes_table = /*#__PURE__*/Object.freeze({
    __proto__: null,
    empty_fixed_size: empty_fixed_size,
    fixed_size: fixed_size,
    get_points: get_points,
    style_cell: style_cell,
    table: table
});

let default_bar_options = {
    ticksize: 0.2,
    range: [0, 1],
    bbox: [V2$5(0, 0), V2$5(10, 10)],
    orientation: 'x',
    headsize: 0.05,
    tick_label_offset: 0,
};
function to_ax_options(baropt) {
    var _a;
    let opt = Object.assign(Object.assign({}, default_bar_options), baropt); // use default if not defined
    opt.bbox = (_a = opt.bbox) !== null && _a !== void 0 ? _a : [V2$5(0, 0), V2$5(10, 10)]; // just to make sure it is defined
    if (opt.orientation == 'x') {
        let ax_opt = {
            xrange: opt.range,
            yrange: [opt.bbox[0].y, opt.bbox[1].y],
            xticks: opt.ticks,
            headsize: opt.headsize,
            ticksize: opt.ticksize,
            bbox: opt.bbox,
            tick_label_offset: opt.tick_label_offset,
        };
        return ax_opt;
    }
    else {
        let ax_opt = {
            xrange: [opt.bbox[0].x, opt.bbox[1].x],
            yrange: opt.range,
            yticks: opt.ticks,
            headsize: opt.headsize,
            ticksize: opt.ticksize,
            bbox: opt.bbox,
            tick_label_offset: opt.tick_label_offset,
        };
        return ax_opt;
    }
}
/**
 * axis for boxplot
 * @param bar_options options for the bar chart
 * @returns a diagram of the axes
 */
function axes(bar_options = {}) {
    let opt = Object.assign(Object.assign({}, default_bar_options), bar_options); // use default if not defined
    let ax_opt = to_ax_options(opt);
    // let ax_f = axes_transform(ax_opt);
    let [lowerleft, upperright] = opt.bbox;
    if (opt.orientation == 'x') {
        let xaxis = arrow2(V2$5(lowerleft.x, 0), V2$5(upperright.x, 0), opt.headsize);
        let xtickmarks = xticks(ax_opt, 0);
        return diagram_combine(xaxis, xtickmarks).stroke('gray').fill('gray');
    }
    else {
        let yaxis = arrow2(V2$5(0, lowerleft.y), V2$5(0, upperright.y), opt.headsize);
        let ytickmarks = yticks(ax_opt, 0);
        return diagram_combine(yaxis, ytickmarks).stroke('gray').fill('gray');
    }
}
/**
 */
function empty_tickmarks(xs, bar_options = {}) {
    let opt = Object.assign(Object.assign({}, default_bar_options), bar_options); // use default if not defined
    let ax_opt = to_ax_options(opt);
    // let ax_f = axes_transform(ax_opt);
    if (opt.orientation == 'x') {
        ax_opt.xticks = xs;
        return xticks(ax_opt, 0, true);
    }
    else {
        ax_opt.yticks = xs;
        return yticks(ax_opt, 0, true);
    }
}
/**
 * Plot a boxplot from quartiles
 * @param quartiles [Q0, Q1, Q2, Q3, Q4]
 * @param pos position of the boxplot
 * @param size size of the boxplot
 * @param bar_options options for the bar chart
 * @returns a diagram of the boxplot
 */
function plotQ(quartiles, pos, size, bar_options) {
    let opt = Object.assign(Object.assign({}, default_bar_options), bar_options); // use default if not defined
    let ax_opt = to_ax_options(opt);
    let ax_f = axes_transform(ax_opt);
    let [Q0, Q1, Q2, Q3, Q4] = quartiles;
    let whisker_size = 0.8 * size;
    if (opt.orientation == 'x') {
        let box = rectangle(Q3 - Q1, size).move_origin('center-left').position(V2$5(Q1, pos)).transform(ax_f);
        let min = line$1(V2$5(Q0, pos - whisker_size / 2), V2$5(Q0, pos + whisker_size / 2)).transform(ax_f);
        let max = line$1(V2$5(Q4, pos - whisker_size / 2), V2$5(Q4, pos + whisker_size / 2)).transform(ax_f);
        let median = line$1(V2$5(Q2, pos - size / 2), V2$5(Q2, pos + size / 2)).transform(ax_f);
        let whisker_min = line$1(V2$5(Q0, pos), V2$5(Q1, pos)).transform(ax_f);
        let whisker_max = line$1(V2$5(Q3, pos), V2$5(Q4, pos)).transform(ax_f);
        return diagram_combine(box, min, max, median, whisker_min, whisker_max);
    }
    else {
        let box = rectangle(size, Q3 - Q1).move_origin('bottom-center').position(V2$5(pos, Q1)).transform(ax_f);
        let min = line$1(V2$5(pos - whisker_size / 2, Q0), V2$5(pos + whisker_size / 2, Q0)).transform(ax_f);
        let max = line$1(V2$5(pos - whisker_size / 2, Q4), V2$5(pos + whisker_size / 2, Q4)).transform(ax_f);
        let median = line$1(V2$5(pos - size / 2, Q2), V2$5(pos + size / 2, Q2)).transform(ax_f);
        let whisker_min = line$1(V2$5(pos, Q0), V2$5(pos, Q1)).transform(ax_f);
        let whisker_max = line$1(V2$5(pos, Q3), V2$5(pos, Q4)).transform(ax_f);
        return diagram_combine(box, min, max, median, whisker_min, whisker_max);
    }
}
// TODO: plot boxplot from data
// TODO: plot multiple boxplots at once

var shapes_boxplot = /*#__PURE__*/Object.freeze({
    __proto__: null,
    axes: axes,
    default_bar_options: default_bar_options,
    empty_tickmarks: empty_tickmarks,
    plotQ: plotQ,
    to_ax_options: to_ax_options
});

var GeoType;
(function (GeoType) {
    GeoType["LINE"] = "LINE";
})(GeoType || (GeoType = {}));
// TODO : CeoCircle
function intersect(o1, o2) {
    if (o1.type === GeoType.LINE && o2.type === GeoType.LINE) {
        let l1 = o1;
        let l2 = o2;
        let p = line_intersection(l1, l2);
        return [p];
    }
    return [];
}
/**
 * Get a point that is `d` distance away from `p` in the direction of `dir`
 * *ideally, point `p` should be in line `l`*
 */
function point_onLine_atDistance_from(l, d, p) {
    let dir = l.dir.normalize();
    return p.add(dir.scale(d));
}
/**
 * Get a point
 * - that is collinear with `p1` and `p2`
 * - that is `len` away from `p2` in the direction away from `p1`
 */
function point_collinear_extend_length(p1, p2, len) {
    let dir = p2.sub(p1).normalize();
    return p2.add(dir.scale(len));
}
/** Get a point that is `t` fraction of the way from `p1` to `p2` */
function point_collinear_fraction(p1, p2, t) {
    let dir = p2.sub(p1);
    return p1.add(dir.scale(t));
}
/** Get a point on line `l` with x-coordinate `x` */
function point_onLine_with_x(l, x) {
    let m = l.dir.y / l.dir.x;
    let c = l.p.y - m * l.p.x;
    return V2$5(x, m * x + c);
}
/** Get a point on line `l` with y-coordinate `y` */
function point_onLine_with_y(l, y) {
    let m = l.dir.y / l.dir.x;
    let c = l.p.y - m * l.p.x;
    return V2$5((y - c) / m, y);
}
/** Get the intersection point of two lines */
function line_intersection(l1, l2) {
    let a1 = l1.p;
    let b1 = l1.p.add(l1.dir);
    let a2 = l2.p;
    let b2 = l2.p.add(l2.dir);
    let x1 = a1.x;
    let y1 = a1.y;
    let x2 = b1.x;
    let y2 = b1.y;
    let x3 = a2.x;
    let y3 = a2.y;
    let x4 = b2.x;
    let y4 = b2.y;
    let d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    let x = ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / d;
    let y = ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / d;
    return V2$5(x, y);
}
// Constructing lines
function line(p, dir) {
    return { type: GeoType.LINE, p, dir };
}
function line_from_points(p1, p2) {
    return line(p1, p2.sub(p1));
}
function line_from_slope(p, slope) {
    return line(p, V2$5(1, slope));
}
function line_from_angle(p, angle) {
    return line(p, Vdir(angle));
}
/** Define a line that is parallel to `l` and passes through `p` */
function line_parallel_at_point(l, p) {
    return line(p, l.dir);
}
/** Define a line that is perpendicular to `l` and passes through `p` */
function line_perpendicular_at_point(l, p) {
    return line(p, V2$5(-l.dir.y, l.dir.x));
}
/** Define a line that has the direction of `l` rotated by `angle` and passes through `p` */
function line_rotated_at_point(l, angle, p) {
    return line(p, l.dir.rotate(angle));
}
function line_intersect_bbox(l, bbox) {
    let [bottom_left, top_right] = bbox;
    let bl = bottom_left;
    let tr = top_right;
    let tl = V2$5(bl.x, tr.y);
    let br = V2$5(tr.x, bl.y);
    let intersections = [
        line_intersection(l, line_from_points(tl, tr)),
        line_intersection(l, line_from_points(tr, br)),
        line_intersection(l, line_from_points(br, bl)),
        line_intersection(l, line_from_points(bl, tl)),
    ];
    const tol = 1e-6; // tolerance
    const is_inside_bbox = (p) => {
        return p.x >= bl.x - tol && p.x <= tr.x + tol && p.y >= bl.y - tol && p.y <= tr.y + tol;
    };
    let points = intersections.filter(p => is_inside_bbox(p));
    if (points.length <= 1)
        return undefined;
    return line$1(points[0], points[1]);
}
// drawing
function normalize_padding(padding) {
    let p = (typeof padding === 'number') ? [padding] : padding;
    switch (p.length) {
        case 0: return [0, 0, 0, 0];
        case 1: return [p[0], p[0], p[0], p[0]];
        case 2: return [p[0], p[1], p[0], p[1]];
        case 3: return [p[0], p[1], p[2], p[1]];
        default: return [p[0], p[1], p[2], p[3]];
    }
}
/**
 * Get a preview diagram of the context
 * @param ctx the Geo context (a dictionary of GeoObj and Vector2)
 * @param pad padding around the diagram (determine how far away from the defined point the visible diagram is)
 */
function get_preview_diagram(ctx, pad) {
    let points = [];
    let lines = [];
    let typelist = {
        [GeoType.LINE]: lines
    };
    let object_names = Object.keys(ctx);
    for (let name of object_names) {
        let obj = ctx[name];
        if (typeof (obj) === 'number') {
            continue;
        }
        else if (obj instanceof Vector2) {
            points.push({ name, p: obj });
        }
        else {
            typelist[obj.type].push({ name, obj });
        }
    }
    let minx = Math.min(...points.map(p => p.p.x));
    let maxx = Math.max(...points.map(p => p.p.x));
    let miny = Math.min(...points.map(p => p.p.y));
    let maxy = Math.max(...points.map(p => p.p.y));
    if (pad == undefined)
        pad = Math.max(maxx - minx, maxy - miny) * 0.1;
    pad = normalize_padding(pad);
    let bbox = [V2$5(minx - pad[0], miny - pad[1]), V2$5(maxx + pad[2], maxy + pad[3])];
    let dg_lines = lines.map(l => line_intersect_bbox(l.obj, bbox)).filter(d => d !== undefined);
    let r = Math.max(bbox[1].x - bbox[0].x, bbox[1].y - bbox[0].y) * 0.01 * 2 / 3;
    let dg_points = points.map(p => {
        let c = circle(r).translate(p.p).fill('black');
        let name = textvar(p.name).translate(p.p.add(V2$5(r * 2, r * 2))).move_origin_text('bottom-left');
        let namebg = name.copy().textfill('white').textstroke('white').textstrokewidth(10).opacity(0.7);
        return c.combine(namebg, name);
    });
    return diagram_combine(...dg_lines, ...dg_points);
}

var geo_construct = /*#__PURE__*/Object.freeze({
    __proto__: null,
    get_preview_diagram: get_preview_diagram,
    intersect: intersect,
    line: line,
    line_from_angle: line_from_angle,
    line_from_points: line_from_points,
    line_from_slope: line_from_slope,
    line_intersection: line_intersection,
    line_parallel_at_point: line_parallel_at_point,
    line_perpendicular_at_point: line_perpendicular_at_point,
    line_rotated_at_point: line_rotated_at_point,
    point_collinear_extend_length: point_collinear_extend_length,
    point_collinear_fraction: point_collinear_fraction,
    point_onLine_atDistance_from: point_onLine_atDistance_from,
    point_onLine_with_x: point_onLine_with_x,
    point_onLine_with_y: point_onLine_with_y
});

// C. Buchheim, M. J Unger, and S. Leipert. Improving Walker's algorithm to run in linear time. In Proc. Graph Drawing (GD), 2002. http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.16.8757
// article : https://llimllib.github.io/pymag-trees/
class TreeDraw {
    constructor(tree, parent, depth = 0, number = 0) {
        var _a;
        this.diagram = tree.value;
        this.size = size(this.diagram);
        this.x = -1.0;
        this.y = depth;
        this.tree = tree;
        let tree_children = (_a = tree.children) !== null && _a !== void 0 ? _a : [];
        this.children = tree_children.map((child, i) => new TreeDraw(child, this, depth + 1, i));
        this.parent = parent;
        this.thread = undefined;
        this.mod = 0;
        this.ancestor = this;
        this.change = 0;
        this.shift = 0;
        this.number = number;
    }
    left() {
        if (this.thread)
            return this.thread;
        if (this.children.length > 0)
            return this.children[0];
        return undefined;
    }
    right() {
        if (this.thread)
            return this.thread;
        if (this.children.length > 0)
            return this.children[this.children.length - 1];
        return undefined;
    }
    lsibling() {
        if (!this.parent)
            return undefined;
        if (this.number > 0)
            return this.parent.children[this.number - 1];
        return undefined;
    }
}
function calculate_tree_buchheim(tree, vertical_dist, horizontal_gap) {
    let treeDraw = new TreeDraw(tree, undefined);
    let dt = first_walk(treeDraw, horizontal_gap);
    let min = second_walk(dt, 0, 0, vertical_dist, 0);
    if (min < 0)
        third_walk(dt, -min);
    position_diagram(dt);
    return dt;
}
function position_diagram(tree) {
    tree.diagram = tree.diagram.position(V2$5(tree.x, tree.y));
    tree.children.forEach(position_diagram);
}
function third_walk(td, n) {
    td.x += n;
    td.children.forEach(child => third_walk(child, n));
}
function first_walk(td, horizontal_gap) {
    let self_halfwidth = td.size[0] / 2;
    if (td.children.length === 0) {
        let lbrother = td.lsibling();
        if (lbrother) {
            let lbrother_halfwidth = lbrother.size[0] / 2;
            let dist = lbrother_halfwidth + self_halfwidth + horizontal_gap;
            td.x = lbrother.x + dist;
        }
        else {
            td.x = 0;
        }
    }
    else {
        let default_ancestor = td.children[0];
        td.children.forEach(w => {
            first_walk(w, horizontal_gap);
            default_ancestor = apportion(w, default_ancestor, horizontal_gap);
        });
        execute_shifts(td);
        let midpoint = (td.children[0].x + td.children[td.children.length - 1].x) / 2;
        let lbrother = td.lsibling();
        if (lbrother) {
            let lbrother_halfwidth = lbrother.size[0] / 2;
            let dist = lbrother_halfwidth + self_halfwidth + horizontal_gap;
            td.x = lbrother.x + dist;
            td.mod = td.x - midpoint;
        }
        else {
            td.x = midpoint;
        }
    }
    return td;
}
function apportion(v, default_ancestor, horizontal_gap) {
    let w = v.lsibling();
    if (w !== undefined) {
        let lmost_sibling = (!v.parent || v.number === 0) ? undefined : v.parent.children[0];
        let vir = v;
        let vor = v;
        let vil = w;
        let vol = lmost_sibling;
        let sir = v.mod;
        let sor = v.mod;
        let sil = vil.mod;
        let sol = vol.mod;
        while ((vil === null || vil === void 0 ? void 0 : vil.right()) !== undefined && (vir === null || vir === void 0 ? void 0 : vir.left()) !== undefined) {
            vil = vil.right();
            vir = vir.left();
            vol = vol === null || vol === void 0 ? void 0 : vol.left();
            vor = vor === null || vor === void 0 ? void 0 : vor.right();
            vor.ancestor = v;
            let lhalfwidth = vil.size[0] / 2;
            let rhalfwidth = vir.size[0] / 2;
            let dist = lhalfwidth + rhalfwidth + horizontal_gap;
            let shift = (vil.x + sil) - (vir.x + sir) + dist;
            if (shift > 0) {
                let a = ancestor(vil, v, default_ancestor);
                move_subtree(a, v, shift);
                sir += shift;
                sor += shift;
            }
            sil += vil.mod;
            sir += vir.mod;
            sol += vol.mod;
            sor += vor.mod;
        }
        if (vil.right() !== undefined && vor.right() === undefined) {
            vor.thread = vil.right();
            vor.mod += sil - sor;
        }
        else {
            if ((vir === null || vir === void 0 ? void 0 : vir.left()) !== undefined && (vol === null || vol === void 0 ? void 0 : vol.left()) === undefined) {
                vol.thread = vir.left();
                vol.mod += sir - sol;
            }
            default_ancestor = v;
        }
    }
    return default_ancestor;
}
function move_subtree(wl, wr, shift) {
    let subtrees = wr.number - wl.number;
    wr.change -= shift / subtrees;
    wr.shift += shift;
    wl.change += shift / subtrees;
    wr.x += shift;
    wr.mod += shift;
}
function execute_shifts(td) {
    let shift = 0;
    let change = 0;
    for (let i = td.children.length - 1; i >= 0; i--) {
        let w = td.children[i];
        w.x += shift;
        w.mod += shift;
        change += w.change;
        shift += w.shift + change;
    }
}
function ancestor(vil, v, default_ancestor) {
    var _a;
    if ((_a = v.parent) === null || _a === void 0 ? void 0 : _a.children.includes(vil.ancestor))
        return vil.ancestor;
    return default_ancestor;
}
function second_walk(td, m, depth, vertical_dist, min) {
    td.x += m;
    td.y = -depth * vertical_dist;
    // if (min === undefined) min = v.x;
    min = Math.min(min !== null && min !== void 0 ? min : td.x, td.x);
    td.children.forEach(w => {
        min = second_walk(w, m + td.mod, depth + 1, vertical_dist, min);
    });
    return min;
}

/**
 * Create a tree diagram from a tree node
 * @param node root node of the tree
 * @param vertical_dist vertical distance between nodes
 * @param horizontal_gap horizontal gap between nodes
 * @returns tree diagram
 */
function tree(node, vertical_dist, horizontal_gap) {
    let treeDraw = calculate_tree_buchheim(node, vertical_dist, horizontal_gap);
    return diagram_from_treeDraw(treeDraw);
}
/**
 * Mirror a tree node
 * @param node root node of the tree
 * @returns mirrored tree node
 */
function mirror_treenode(node) {
    var _a;
    return { value: node.value, children: ((_a = node.children) !== null && _a !== void 0 ? _a : []).map(mirror_treenode).reverse() };
}
/**
 * Helper function to create a diagram from a treeDraw
 * @param node treeDraw node
 * @returns diagram
 */
function diagram_from_treeDraw(node) {
    let node_dg = node.diagram;
    let children_dglist = node.children.map(diagram_from_treeDraw);
    let line_diagrams = node.children.map(child_node => {
        let start = node_dg.get_anchor('bottom-center');
        let end = child_node.diagram.get_anchor('top-center');
        return line$1(start, end);
    });
    return diagram_combine(node_dg, ...line_diagrams, ...children_dglist);
}

var shapes_tree = /*#__PURE__*/Object.freeze({
    __proto__: null,
    mirror_treenode: mirror_treenode,
    tree: tree
});

// Simple encoding/decoding utilities using btoa, atob and encodeURIComponent, decodeURIComponent
// can be used to store user code and pass it in the URL
function encode(s) {
    return btoa(encodeURIComponent(s));
}
function decode(s) {
    return decodeURIComponent(atob(s));
}

var encoding = /*#__PURE__*/Object.freeze({
    __proto__: null,
    decode: decode,
    encode: encode
});

// export * from '../diagramatics/src/index.js'

var dg = /*#__PURE__*/Object.freeze({
    __proto__: null,
    Diagram: Diagram,
    Interactive: Interactive,
    Path: Path,
    get TAG () { return TAG; },
    V2: V2$5,
    Vdir: Vdir,
    Vector2: Vector2,
    _init_default_diagram_style: _init_default_diagram_style,
    _init_default_text_diagram_style: _init_default_text_diagram_style,
    _init_default_textdata: _init_default_textdata,
    align_horizontal: align_horizontal,
    align_vertical: align_vertical,
    annotation: shapes_annotation,
    arc: arc,
    array_repeat: array_repeat,
    arrow: arrow,
    arrow1: arrow1,
    arrow2: arrow2,
    ax: ax,
    axes_corner_empty: axes_corner_empty,
    axes_empty: axes_empty,
    axes_transform: axes_transform,
    bar: shapes_bar,
    boxplot: shapes_boxplot,
    circle: circle,
    clientPos_to_svgPos: clientPos_to_svgPos,
    cubic_spline: cubic_spline,
    curve: curve,
    default_diagram_style: default_diagram_style,
    default_text_diagram_style: default_text_diagram_style,
    default_textdata: default_textdata,
    diagram_combine: diagram_combine,
    distribute_grid_row: distribute_grid_row,
    distribute_horizontal: distribute_horizontal,
    distribute_horizontal_and_align: distribute_horizontal_and_align,
    distribute_variable_row: distribute_variable_row,
    distribute_vertical: distribute_vertical,
    distribute_vertical_and_align: distribute_vertical_and_align,
    download_svg_as_png: download_svg_as_png,
    download_svg_as_svg: download_svg_as_svg,
    draw_to_svg: draw_to_svg,
    draw_to_svg_element: draw_to_svg_element,
    empty: empty,
    encoding: encoding,
    geo_construct: geo_construct,
    geometry: shapes_geometry,
    get_SVGPos_from_event: get_SVGPos_from_event,
    get_tagged_svg_element: get_tagged_svg_element,
    graph: shapes_graph,
    handle_tex_in_svg: handle_tex_in_svg,
    image: image,
    line: line$1,
    linspace: linspace,
    linspace_exc: linspace_exc,
    mechanics: shapes_mechanics,
    mod: modifier,
    multiline: multiline,
    multiline_bb: multiline_bb,
    numberline: shapes_numberline,
    plot: plot$1,
    plotf: plotf,
    plotv: plotv,
    polygon: polygon,
    range: range,
    range_inc: range_inc,
    rectangle: rectangle,
    rectangle_corner: rectangle_corner,
    regular_polygon: regular_polygon,
    regular_polygon_side: regular_polygon_side,
    reset_default_styles: reset_default_styles,
    square: square,
    str_latex_to_unicode: str_latex_to_unicode,
    str_to_mathematical_italic: str_to_mathematical_italic,
    table: shapes_table,
    text: text,
    textvar: textvar,
    to_degree: to_degree,
    to_radian: to_radian,
    transpose: transpose,
    tree: shapes_tree,
    under_curvef: under_curvef,
    utils: utils,
    xaxis: xaxis,
    xgrid: xgrid,
    xtickmark: xtickmark,
    xtickmark_empty: xtickmark_empty,
    xticks: xticks,
    xyaxes: xyaxes,
    xycorneraxes: xycorneraxes,
    xygrid: xygrid,
    yaxis: yaxis,
    ygrid: ygrid,
    ytickmark: ytickmark,
    ytickmark_empty: ytickmark_empty,
    yticks: yticks
});

/** TypeScript helper function to assert that a value is of type `never` */
function assertNever(msg, x) {
    throw new Error(msg + x);
}
/** Helper function to check in runtime if a string is a member of an enum */
function isStringInEnum(value, enumType) {
    return Object.values(enumType).includes(value);
}

var STYLE_KEYS;
(function (STYLE_KEYS) {
    STYLE_KEYS["GENERAL_DIAGRAM"] = "GENERAL_DIAGRAM";
    STYLE_KEYS["GENERAL_VARIABLE"] = "GENERAL_VARIABLE";
    STYLE_KEYS["GENERAL_HEADING"] = "GENERAL_HEADING";
    // Cartesian grid
    STYLE_KEYS["CARTESIAN_GRID_GRID"] = "CARTESIAN_GRID_GRID";
    STYLE_KEYS["CARTESIAN_GRID_AXES"] = "CARTESIAN_GRID_AXES";
    STYLE_KEYS["CARTESIAN_GRID_TICKS"] = "CARTESIAN_GRID_TICKS";
    STYLE_KEYS["CARTESIAN_GRID_LABEL"] = "CARTESIAN_GRID_LABEL";
    STYLE_KEYS["CARTESIAN_GRID_LINE"] = "CARTESIAN_GRID_LINE";
    // Graph
    STYLE_KEYS["GRAPH_GRID"] = "GRAPH_GRID";
    STYLE_KEYS["GRAPH_AXES"] = "GRAPH_AXES";
    STYLE_KEYS["GRAPH_TICKS"] = "GRAPH_TICKS";
    STYLE_KEYS["GRAPH_LINE"] = "GRAPH_LINE";
    STYLE_KEYS["GRAPH_ANNOTATION_TEXT"] = "GRAPH_ANNOTATION_TEXT";
    STYLE_KEYS["GRAPH_ANNOTATION_TEXTBG"] = "GRAPH_ANNOTATION_TEXTBG";
    // BoxPlot
    STYLE_KEYS["BOX_PLOT_BOX"] = "BOX_PLOT_BOX";
    STYLE_KEYS["BOX_PLOT_LABEL"] = "BOX_PLOT_LABEL";
})(STYLE_KEYS || (STYLE_KEYS = {}));
var STYLE_MISC_KEYS;
(function (STYLE_MISC_KEYS) {
    STYLE_MISC_KEYS["X_AXIS_BREAK"] = "X_AXIS_BREAK";
    STYLE_MISC_KEYS["SHOW_GRID"] = "SHOW_GRID";
    STYLE_MISC_KEYS["NO_GRAPH_BOUND_OVERSHOOT"] = "NO_GRAPH_OVERSHOOT";
    STYLE_MISC_KEYS["LINE_GRAPH_CUBIC_SPLINE"] = "LINE_GRAPH_CUBIC_SPLINE";
    STYLE_MISC_KEYS["USE_CORNER_AXES"] = "USE_CORNER_AXES";
})(STYLE_MISC_KEYS || (STYLE_MISC_KEYS = {}));

function pt_to_px(n) {
    return n * 4 / 3;
}
function parseNumberArray(str) {
    var _a;
    return (_a = JSON.parse(str)) !== null && _a !== void 0 ? _a : [];
}
function styleF(style) {
    return (d) => {
        return d
            .apply(diagramStyleF(style.diagram))
            .apply(textDataF(style.text))
            .apply(textStyleF(style.text));
    };
}
function diagramStyleF(style) {
    return (d) => {
        for (let key in style) {
            let value = style[key];
            switch (key) {
                case "stroke":
                    d = d.stroke(value);
                    break;
                case "fill":
                    d = d.fill(value);
                    break;
                case "opacity":
                    d = d.opacity(parseFloat(value));
                    break;
                case "stroke-width":
                    d = d.strokewidth(parseFloat(value));
                    break;
                case "stroke-linecap":
                    d = d.strokelinecap(value);
                    break;
                case "stroke-dasharray":
                    d = d.strokedasharray(parseNumberArray(value));
                    break;
                case "stroke-linejoin":
                    d = d.strokelinejoin(value);
                    break;
                case "vector-effect":
                    d = d.vectoreffect(value);
                    break;
            }
        }
        return d;
    };
}
function textDataF(textdata) {
    return (d) => {
        for (let key in textdata) {
            let value = textdata[key];
            switch (key) {
                case "font-family":
                    d = d.fontfamily(value);
                    break;
                case "font-size":
                    d = d.fontsize(parseFloat(value));
                    break;
                case "font-weight":
                    d = d.fontweight(value);
                    break;
                case "font-style":
                    d = d.fontstyle(value);
                    break;
                case "text-anchor":
                    d = d.textanchor(value);
                    break;
                case "dy":
                    d = d.textdy(value);
                    break;
                case "angle":
                    d = d.textangle(parseFloat(value));
                    break;
                case "font-scale":
                    d = d.fontscale(value);
                    break;
            }
        }
        return d;
    };
}
function textStyleF(style) {
    return (d) => {
        for (let key in style) {
            let value = style[key];
            switch (key) {
                case "stroke":
                    d = d.textstroke(value);
                    break;
                case "fill":
                    d = d.textfill(value);
                    break;
                case "stroke-width":
                    d = d.textstrokewidth(parseFloat(value));
                    break;
            }
        }
        return d;
    };
}
// ---------- default in diagramatics
// export const default_diagram_style : DiagramStyle = {
//     "fill"             : "none",
//     "stroke"           : "black",
//     "stroke-width"     : "1",
//     "stroke-linecap"   : "butt",
//     "stroke-dasharray" : "none",
//     "stroke-linejoin"  : "round",
//     "vector-effect"    : "non-scaling-stroke",
//     "opacity"          : "1",
// }
//
// export const default_text_diagram_style : DiagramStyle = {
//     "fill"             : "black",
//     "stroke"           : "none",
//     "stroke-width"     : "1",
//     "stroke-linecap"   : "butt",
//     "stroke-dasharray" : "none",
//     "stroke-linejoin"  : "round",
//     "vector-effect"    : "non-scaling-stroke",
//     "opacity"          : "1",
// }
//
// export const default_textdata : TextData = {
//     "text"             : "",
//     "font-family"      : "Latin Modern Math, sans-serif",
//     "font-size"        : "18",
//     "font-weight"      : "normal",
//     "text-anchor"      : "middle",
//     "dy"               : "0.25em",
//     "angle"            : "0",
//     "font-style"       : "normal",
//     "font-scale"       : "auto",
// }

const THICK_TICKMARK = {
    [STYLE_KEYS.CARTESIAN_GRID_TICKS]: {
        diagram: {
            'stroke': 'black',
            'stroke-width': '2',
        },
        text: {},
        misc: {},
    }
};
const X_AXIS_BREAK = {
    [STYLE_KEYS.GRAPH_AXES]: {
        diagram: {},
        text: {},
        misc: {
            [STYLE_MISC_KEYS.X_AXIS_BREAK]: true,
        },
    },
};
const SHOW_GRID = {
    [STYLE_KEYS.GRAPH_AXES]: {
        diagram: {},
        text: {},
        misc: {
            [STYLE_MISC_KEYS.SHOW_GRID]: true,
        },
    }
};
const NO_GRAPH_BOUND_OVERSHOOT = {
    [STYLE_KEYS.GRAPH_AXES]: {
        diagram: {},
        text: {},
        misc: {
            [STYLE_MISC_KEYS.NO_GRAPH_BOUND_OVERSHOOT]: true,
        },
    }
};
const LINE_GRAPH_CUBIC_SPLINE = {
    [STYLE_KEYS.GRAPH_LINE]: {
        diagram: {},
        text: {},
        misc: {
            [STYLE_MISC_KEYS.LINE_GRAPH_CUBIC_SPLINE]: true,
        },
    }
};
const BOLD_GRAPH_ANNOTATION = {
    [STYLE_KEYS.GRAPH_ANNOTATION_TEXT]: {
        diagram: {}, misc: {},
        text: {
            "font-family": "'Helvetica Neue LT Std 75 Bold', 'Helvetica'",
            "font-weight": "bold",
            "font-size": pt_to_px(12).toString(),
            "fill": "black",
        },
    },
    [STYLE_KEYS.GRAPH_ANNOTATION_TEXTBG]: {
        diagram: {}, misc: {},
        text: {
            "fill": "none",
            "stroke": "white",
            "stroke-width": pt_to_px(5).toString(),
        },
    },
};
const BOLD_DATA_LABEL = {
    [STYLE_KEYS.GRAPH_ANNOTATION_TEXT]: {
        diagram: {}, misc: {},
        text: {
            "font-family": "'Helvetica Neue LT Std 75 Bold', 'Helvetica'",
            "font-weight": "bold",
            "font-size": pt_to_px(12).toString(),
            "fill": "black",
        },
    },
    [STYLE_KEYS.GRAPH_ANNOTATION_TEXTBG]: {
        diagram: {}, misc: {},
        text: {
            "fill": "none",
            "stroke": "white",
            "stroke-width": pt_to_px(5).toString(),
        },
    },
    [STYLE_KEYS.BOX_PLOT_LABEL]: {
        diagram: {}, misc: {},
        text: {
            "font-family": "'Helvetica Neue LT Std 75 Bold', 'Helvetica'",
            "font-weight": "bold",
            "font-size": pt_to_px(12).toString(),
            "fill": "black",
        },
    },
};
const BIG_HEADING = {
    [STYLE_KEYS.GENERAL_HEADING]: {
        diagram: {},
        text: {
            "font-family": "'Helvetica Neue LT Std 75 Bold', 'Helvetica'",
            "font-weight": "bold",
            "font-size": pt_to_px(14).toString(),
        },
        misc: {},
    },
};
const USE_CORNER_AXES = {
    [STYLE_KEYS.CARTESIAN_GRID_AXES]: {
        diagram: {}, text: {},
        misc: {
            [STYLE_MISC_KEYS.USE_CORNER_AXES]: true,
        },
    }
};
const VRETTA_STYLEPROFILE = {
    [STYLE_KEYS.GENERAL_DIAGRAM]: {
        diagram: {
            stroke: "black",
        },
        text: {
            "font-family": "'Helvetica Neue LT Std 55 Roman', 'Helvetica'",
            "font-size": pt_to_px(12).toString(),
            "fill": "black",
        },
        misc: {},
    },
    [STYLE_KEYS.GENERAL_VARIABLE]: {
        diagram: {},
        text: {
            "font-family": "'Times New Roman'",
            "font-style": "italic",
            "font-size": pt_to_px(12).toString(),
            "fill": "black",
        },
        misc: {},
    },
    [STYLE_KEYS.GENERAL_HEADING]: {
        diagram: {},
        text: {
            "font-family": "'Helvetica Neue LT Std 75 Bold', 'Helvetica'",
            "font-weight": "bold",
            "font-size": pt_to_px(12).toString(),
        },
        misc: {},
    },
    [STYLE_KEYS.CARTESIAN_GRID_GRID]: {
        diagram: {
            fill: "lightgray",
        },
        text: {},
        misc: {},
    },
    [STYLE_KEYS.CARTESIAN_GRID_AXES]: {
        diagram: {
            'stroke': 'black',
            'fill': 'black',
            'stroke-width': '1.5',
        },
        text: {
            'fill': 'black',
        },
        misc: {},
    },
    [STYLE_KEYS.CARTESIAN_GRID_LABEL]: {
        diagram: {},
        text: {
            "font-family": "'Helvetica Neue LT Std 75 Bold', 'Helvetica'",
            "font-weight": "bold",
            'font-size': pt_to_px(12).toString(),
            'fill': 'black',
        },
        misc: {},
    },
    [STYLE_KEYS.CARTESIAN_GRID_LINE]: {
        diagram: {
            'stroke': 'black',
            'stroke-width': '1.5',
            'fill': 'black' // for arrow
        },
        text: {},
        misc: {},
    },
    [STYLE_KEYS.GRAPH_AXES]: {
        diagram: {
            'stroke': 'black',
            'fill': 'black',
            'stroke-width': '1.5',
        },
        text: {
            'fill': 'black',
        },
        misc: {},
    },
    [STYLE_KEYS.GRAPH_GRID]: {
        diagram: {
            'stroke': 'black',
            'opacity': '0.5',
            'stroke-width': '0.5',
        },
        text: {},
        misc: {},
    },
    [STYLE_KEYS.GRAPH_TICKS]: {
        diagram: {
            'stroke': 'gray',
            'stroke-width': '1',
        },
        text: {
            "font-family": "'Helvetica Neue LT Std 55 Roman', 'Helvetica'",
            "font-size": pt_to_px(12).toString(),
            "fill": "black",
        },
        misc: {},
    },
    [STYLE_KEYS.GRAPH_LINE]: {
        diagram: {
            'stroke': 'black',
            'stroke-width': '1.5',
        },
        text: {},
        misc: {},
    },
    [STYLE_KEYS.GRAPH_ANNOTATION_TEXT]: {
        diagram: {}, misc: {},
        text: {
            "font-family": "'Helvetica Neue LT Std 55 Roman', 'Helvetica'",
            "font-size": pt_to_px(12).toString(),
            "fill": "black",
        },
    },
    [STYLE_KEYS.GRAPH_ANNOTATION_TEXTBG]: {
        diagram: {}, misc: {},
        text: {
            "fill": "none",
            "stroke": "white",
            "stroke-width": pt_to_px(3).toString(),
        },
    },
    [STYLE_KEYS.BOX_PLOT_BOX]: {
        diagram: {
            'stroke': 'black',
            'stroke-width': '1.5',
        },
        text: {},
        misc: {},
    },
};

const styleprofile_list = {
    'vretta': VRETTA_STYLEPROFILE,
    'bigHeading': BIG_HEADING,
    'thickTickmark': THICK_TICKMARK,
    'xAxisBreak': X_AXIS_BREAK,
    'showGrid': SHOW_GRID,
    'noGraphBoundOvershoot': NO_GRAPH_BOUND_OVERSHOOT,
    'lineGraphCubicSpline': LINE_GRAPH_CUBIC_SPLINE,
    'lineGraphSmooth': LINE_GRAPH_CUBIC_SPLINE, //alias
    'boldGraphAnnotation': BOLD_GRAPH_ANNOTATION,
    'useCornerAxes': USE_CORNER_AXES,
    'boldDataLabel': BOLD_DATA_LABEL,
};
function combineStyle(styles) {
    let diagram = {};
    let text = {};
    let misc = {};
    for (let s of styles) {
        for (let key in s.diagram)
            diagram[key] = s.diagram[key];
        for (let key in s.text)
            text[key] = s.text[key];
        for (let key in s.misc)
            misc[key] = s.misc[key];
    }
    return { diagram, text, misc };
}
function combineStyleprofiles(...styleprofiles) {
    let combined = {};
    for (let sp of styleprofiles) {
        for (let key in sp) {
            if (combined[key]) {
                combined[key] = combineStyle([combined[key], sp[key]]);
            }
            else {
                combined[key] = sp[key];
            }
        }
    }
    return combined;
}
function styleprofilelistSingleF(stylemapnames, key) {
    let styleProfile = combineStyleprofiles(...stylemapnames.map(name => { var _a; return (_a = styleprofile_list[name]) !== null && _a !== void 0 ? _a : {}; }));
    return (d) => {
        if (styleProfile[key]) {
            return d.apply(styleF(styleProfile[key]));
        }
        return d;
    };
}
function getStyleProfilesMisc(stylemapnames, stylekey, misckey) {
    var _a;
    let styleProfile = combineStyleprofiles(...stylemapnames.map(name => { var _a; return (_a = styleprofile_list[name]) !== null && _a !== void 0 ? _a : {}; }));
    return (_a = styleProfile[stylekey]) === null || _a === void 0 ? void 0 : _a.misc[misckey];
}
function styleprofilelistF(stylemapnames, key) {
    if (Array.isArray(key)) {
        let fs = key.map(k => styleprofilelistSingleF(stylemapnames, k));
        return (d) => fs.reduce((d, f) => f(d), d);
    }
    return styleprofilelistSingleF(stylemapnames, key);
}

var styleprofile_list$1 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    get STYLE_KEYS () { return STYLE_KEYS; },
    get STYLE_MISC_KEYS () { return STYLE_MISC_KEYS; },
    getStyleProfilesMisc: getStyleProfilesMisc,
    styleprofile_list: styleprofile_list,
    styleprofilelistF: styleprofilelistF
});

const V2$4 = V2$5;
const CARTESIAN_GRID_TYPE = "CartesianGrid";
var CARTESIAN_GRID_ELEMENT_TYPE;
(function (CARTESIAN_GRID_ELEMENT_TYPE) {
    CARTESIAN_GRID_ELEMENT_TYPE["Line"] = "Line";
    CARTESIAN_GRID_ELEMENT_TYPE["Segment"] = "Segment";
    CARTESIAN_GRID_ELEMENT_TYPE["Ray"] = "Ray";
    CARTESIAN_GRID_ELEMENT_TYPE["Point"] = "Point";
})(CARTESIAN_GRID_ELEMENT_TYPE || (CARTESIAN_GRID_ELEMENT_TYPE = {}));
function dg_CartesianGrid(obj) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    if (obj.type !== "CartesianGrid")
        return empty();
    let config = obj.config;
    let bounds = config.bounds;
    let xover = (_b = (_a = config.overshoot) === null || _a === void 0 ? void 0 : _a.x) !== null && _b !== void 0 ? _b : 0;
    let yover = (_d = (_c = config.overshoot) === null || _c === void 0 ? void 0 : _c.y) !== null && _d !== void 0 ? _d : 0;
    let xrange = [bounds.left - xover, bounds.right + xover];
    let yrange = [bounds.bottom - yover, bounds.top + yover];
    let xsize = xrange[1] - xrange[0];
    let ysize = yrange[1] - yrange[0];
    let xscale = (_f = (_e = config.scale) === null || _e === void 0 ? void 0 : _e.x) !== null && _f !== void 0 ? _f : 1;
    let yscale = (_h = (_g = config.scale) === null || _g === void 0 ? void 0 : _g.y) !== null && _h !== void 0 ? _h : 1;
    xsize *= xscale;
    ysize *= yscale;
    let bbox = [V2$4(0, 0), V2$4(xsize, ysize)];
    let xwidth = bounds.right - bounds.left;
    let yheight = bounds.top - bounds.bottom;
    let size = Math.max(xwidth / xscale, yheight / yscale) / 10;
    let axopt = {
        xrange, yrange, bbox,
        //TODO: derive from style profile
        ticksize: size / 4,
        headsize: size / 4,
        tick_label_offset: size / 5,
    };
    let styleprofiles = (_j = obj.styleProfiles) !== null && _j !== void 0 ? _j : [];
    let elements = (_k = config.elements) !== null && _k !== void 0 ? _k : [];
    let dg_elements = elements.map((e) => cartesianGridElement(e, axopt, styleprofiles));
    let useCornerAxes = isUseCornerAxes(xrange, yrange, styleprofiles);
    let ax = !useCornerAxes ?
        cartesianGridAxes(obj, axopt, styleprofiles) :
        cartesianCornerGridAxes(obj, axopt, styleprofiles);
    let grid = cartesianGridGrid(obj, axopt, styleprofiles, useCornerAxes);
    return diagram_combine(ax, grid, ...dg_elements);
}
function isUseCornerAxes(xrange, yrange, styleProfiles) {
    let miscConf = getStyleProfilesMisc(styleProfiles, STYLE_KEYS.CARTESIAN_GRID_AXES, STYLE_MISC_KEYS.USE_CORNER_AXES);
    if (miscConf !== undefined)
        return miscConf;
    // if both xrange and yrange contains 0, don't use corner axes (return false)
    let xcontains0 = (xrange[0] < 0 && 0 < xrange[1]);
    let ycontains0 = (yrange[0] < 0 && 0 < yrange[1]);
    return !(xcontains0 && ycontains0);
}
function attachEmpty$2(d) {
    let emp = curve([d.origin]);
    return diagram_combine(emp, d);
}
function cartesianGridGrid(obj, axopt, styleProfiles, useCornerAxes) {
    var _a, _b, _c, _d, _e, _f;
    let xint = (_c = (_b = (_a = obj.config.interval) === null || _a === void 0 ? void 0 : _a.grid) === null || _b === void 0 ? void 0 : _b.x) !== null && _c !== void 0 ? _c : 1;
    let yint = (_f = (_e = (_d = obj.config.interval) === null || _d === void 0 ? void 0 : _d.grid) === null || _e === void 0 ? void 0 : _e.y) !== null && _f !== void 0 ? _f : 1;
    let outer_bounds = {
        left: axopt.xrange[0], right: axopt.xrange[1],
        bottom: axopt.yrange[0], top: axopt.yrange[1],
    };
    let xticks;
    let yticks;
    if (!useCornerAxes) {
        let xticks_right = range_inc(0, outer_bounds.right, xint).slice(1);
        let xticks_left = range_inc(0, outer_bounds.left, -xint).slice(1).reverse();
        xticks = xticks_left.concat(xticks_right);
        let yticks_top = range_inc(0, outer_bounds.top, yint).slice(1);
        let yticks_bottom = range_inc(0, outer_bounds.bottom, -yint).slice(1).reverse();
        yticks = yticks_bottom.concat(yticks_top);
    }
    else {
        xticks = range_inc(outer_bounds.left, outer_bounds.right, xint);
        yticks = range_inc(outer_bounds.bottom, outer_bounds.top, yint);
    }
    return xygrid(Object.assign(Object.assign({}, axopt), { xticks, yticks }))
        .apply(styleprofilelistF(styleProfiles, STYLE_KEYS.GRAPH_GRID));
}
function cartesianGridAxes(obj, axopt, styleProfiles) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    let bounds = obj.config.bounds;
    let outer_bounds = {
        left: axopt.xrange[0], right: axopt.xrange[1],
        bottom: axopt.yrange[0], top: axopt.yrange[1],
    };
    let xint = (_c = (_b = (_a = obj.config.interval) === null || _a === void 0 ? void 0 : _a.axis) === null || _b === void 0 ? void 0 : _b.x) !== null && _c !== void 0 ? _c : 1;
    let yint = (_f = (_e = (_d = obj.config.interval) === null || _d === void 0 ? void 0 : _d.axis) === null || _e === void 0 ? void 0 : _e.y) !== null && _f !== void 0 ? _f : 1;
    let unit = Math.max(outer_bounds.right - outer_bounds.left, outer_bounds.top - outer_bounds.bottom) / 10;
    let transf = axes_transform(axopt);
    let xticks_right = range_inc(0, bounds.right, xint).slice(1);
    let xticks_left = range_inc(0, bounds.left, -xint).slice(1).reverse();
    let xticks = xticks_left.concat(xticks_right);
    let yticks_top = range_inc(0, bounds.top, yint).slice(1);
    let yticks_bottom = range_inc(0, bounds.bottom, -yint).slice(1).reverse();
    let yticks = yticks_bottom.concat(yticks_top);
    let ax = xyaxes(Object.assign(Object.assign({}, axopt), { xticks, yticks }))
        .apply(styleprofilelistF(styleProfiles, STYLE_KEYS.GENERAL_DIAGRAM))
        .apply(styleprofilelistF(styleProfiles, STYLE_KEYS.CARTESIAN_GRID_AXES));
    // .fill('black').stroke('black').strokewidth(2).textfill('black').fontfamily('helvetica');
    let zero = text("0").move_origin_text('top-right')
        .position(V2$4(-unit / 10, -unit / 10).apply(transf))
        .apply(styleprofilelistF(styleProfiles, STYLE_KEYS.GENERAL_DIAGRAM))
        .apply(styleprofilelistF(styleProfiles, STYLE_KEYS.CARTESIAN_GRID_AXES));
    // .textfill('black').fontfamily('helvetica')
    let xvarname = text((_h = (_g = obj.config.label) === null || _g === void 0 ? void 0 : _g.x) !== null && _h !== void 0 ? _h : "x")
        .move_origin_text('center-left')
        .position(V2$4(outer_bounds.right + unit / 4, 0).apply(transf))
        .apply(attachEmpty$2)
        .apply(styleprofilelistF(styleProfiles, STYLE_KEYS.GENERAL_VARIABLE));
    let yvarname = text((_k = (_j = obj.config.label) === null || _j === void 0 ? void 0 : _j.y) !== null && _k !== void 0 ? _k : "y")
        .move_origin_text('bottom-center')
        .position(V2$4(0, outer_bounds.top + unit / 4).apply(transf))
        .apply(attachEmpty$2)
        .apply(styleprofilelistF(styleProfiles, STYLE_KEYS.GENERAL_VARIABLE));
    return diagram_combine(ax, zero, xvarname, yvarname);
}
function cartesianCornerGridAxes(obj, axopt, styleProfiles) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    let bounds = obj.config.bounds;
    let outer_bounds = {
        left: axopt.xrange[0], right: axopt.xrange[1],
        bottom: axopt.yrange[0], top: axopt.yrange[1],
    };
    let xint = (_c = (_b = (_a = obj.config.interval) === null || _a === void 0 ? void 0 : _a.axis) === null || _b === void 0 ? void 0 : _b.x) !== null && _c !== void 0 ? _c : 1;
    let yint = (_f = (_e = (_d = obj.config.interval) === null || _d === void 0 ? void 0 : _d.axis) === null || _e === void 0 ? void 0 : _e.y) !== null && _f !== void 0 ? _f : 1;
    let unit = Math.max(outer_bounds.right - outer_bounds.left, outer_bounds.top - outer_bounds.bottom) / 10;
    let transf = axes_transform(axopt);
    let ax = xycorneraxes(Object.assign(Object.assign({}, axopt), { xticks: range_inc(bounds.left, bounds.right, xint), yticks: range_inc(bounds.bottom, bounds.top, yint) }))
        .apply(styleprofilelistF(styleProfiles, STYLE_KEYS.GENERAL_DIAGRAM))
        .apply(styleprofilelistF(styleProfiles, STYLE_KEYS.CARTESIAN_GRID_AXES));
    let [_ax, _xticks, _yticks] = ax.children;
    _xticks = _xticks.stroke('lightgray').strokewidth(1)
        .apply(styleprofilelistF(styleProfiles, STYLE_KEYS.CARTESIAN_GRID_TICKS));
    _yticks = _yticks.stroke('lightgray').strokewidth(1)
        .apply(styleprofilelistF(styleProfiles, STYLE_KEYS.CARTESIAN_GRID_TICKS));
    ax = diagram_combine(_xticks, _yticks, _ax);
    let diagrams = [ax];
    if ((_g = obj.config.label) === null || _g === void 0 ? void 0 : _g.x) {
        let xvarname = text(obj.config.label.x)
            .move_origin_text('center-left')
            .position(V2$4(outer_bounds.right + unit / 4, outer_bounds.bottom).apply(transf))
            .apply(styleprofilelistF(styleProfiles, STYLE_KEYS.GENERAL_VARIABLE));
        diagrams.push(xvarname);
    }
    if ((_h = obj.config.label) === null || _h === void 0 ? void 0 : _h.y) {
        let yvarname = text(obj.config.label.y)
            .move_origin_text('bottom-center')
            .position(V2$4(outer_bounds.left, outer_bounds.top + unit / 4).apply(transf))
            .apply(styleprofilelistF(styleProfiles, STYLE_KEYS.GENERAL_VARIABLE));
        diagrams.push(yvarname);
    }
    // if bottom left is (0,0) then draw 0
    if (outer_bounds.left === 0 && outer_bounds.bottom === 0) {
        let zero = text("0").move_origin_text('top-right')
            .position(V2$4(-unit / 10, -unit / 10).apply(transf))
            .apply(styleprofilelistF(styleProfiles, STYLE_KEYS.GENERAL_DIAGRAM))
            .apply(styleprofilelistF(styleProfiles, STYLE_KEYS.CARTESIAN_GRID_AXES));
        diagrams.push(zero);
    }
    return diagram_combine(...diagrams);
}
function cartesianGridElement(obj, axopt, styleprofiles) {
    let type = obj["type"];
    let outer_bounds = {
        left: axopt.xrange[0], right: axopt.xrange[1],
        bottom: axopt.yrange[0], top: axopt.yrange[1],
    };
    let unit = Math.max(outer_bounds.right - outer_bounds.left, outer_bounds.top - outer_bounds.bottom) / 10;
    let transf = axes_transform(axopt);
    switch (type) {
        case CARTESIAN_GRID_ELEMENT_TYPE.Point: {
            let obj_point = obj;
            let p = V2$4(obj_point.x, obj_point.y);
            let c = circle(unit / 10).position(transf(p)).fill('black').stroke('none');
            return c;
        }
        case CARTESIAN_GRID_ELEMENT_TYPE.Segment: {
            let obj_line = obj;
            let pA_ = obj_line.pA;
            let pB_ = obj_line.pB;
            let pA = V2$4(pA_.x, pA_.y);
            let pB = V2$4(pB_.x, pB_.y);
            let l = line$1(pA, pB).transform(transf)
                .apply(styleprofilelistF(styleprofiles, STYLE_KEYS.CARTESIAN_GRID_LINE));
            if (!obj_line.isDrawPoints) {
                return l;
            }
            let cA = circle(unit / 10).position(transf(pA)).fill('black').stroke('none');
            let cB = circle(unit / 10).position(transf(pB)).fill('black').stroke('none');
            return diagram_combine(cA, cB, l);
        }
        case CARTESIAN_GRID_ELEMENT_TYPE.Line: {
            let obj_line = obj;
            let pA_ = obj_line.pA;
            let pB_ = obj_line.pB;
            let pA = V2$4(pA_.x, pA_.y);
            let pB = V2$4(pB_.x, pB_.y);
            let l = line$1(pA, pB);
            let ptop = line_intersection_y(l, outer_bounds.top);
            let pbot = line_intersection_y(l, outer_bounds.bottom);
            let pright = line_intersection_x(l, outer_bounds.right);
            let pleft = line_intersection_x(l, outer_bounds.left);
            let valid_points = [];
            if (outer_bounds.left <= ptop.x && ptop.x <= outer_bounds.right)
                valid_points.push(ptop);
            if (outer_bounds.left <= pbot.x && pbot.x <= outer_bounds.right)
                valid_points.push(pbot);
            if (outer_bounds.bottom <= pright.y && pright.y <= outer_bounds.top)
                valid_points.push(pright);
            if (outer_bounds.bottom <= pleft.y && pleft.y <= outer_bounds.top)
                valid_points.push(pleft);
            if (valid_points.length < 2)
                return empty();
            let arrowp0 = valid_points[0].apply(transf);
            let arrowp1 = valid_points[1].apply(transf);
            let arrow = arrow2(arrowp0, arrowp1, axopt.headsize)
                .apply(styleprofilelistF(styleprofiles, STYLE_KEYS.CARTESIAN_GRID_LINE));
            if (!obj_line.isDrawPoints) {
                return arrow;
            }
            let cA = circle(unit / 10).position(transf(pA)).fill('black').stroke('none');
            let cB = circle(unit / 10).position(transf(pB)).fill('black').stroke('none');
            return diagram_combine(cA, cB, arrow);
        }
        case CARTESIAN_GRID_ELEMENT_TYPE.Ray: {
            let obj_line = obj;
            // the ray start at pA and goes through pB
            let pA_ = obj_line.pA;
            let pB_ = obj_line.pB;
            let pA = V2$4(pA_.x, pA_.y);
            let pB = V2$4(pB_.x, pB_.y);
            let l = line$1(pA, pB);
            let ptop = line_intersection_y(l, outer_bounds.top);
            let pbot = line_intersection_y(l, outer_bounds.bottom);
            let pright = line_intersection_x(l, outer_bounds.right);
            let pleft = line_intersection_x(l, outer_bounds.left);
            let valid_points = [];
            if (outer_bounds.left <= ptop.x && ptop.x <= outer_bounds.right)
                valid_points.push(ptop);
            if (outer_bounds.left <= pbot.x && pbot.x <= outer_bounds.right)
                valid_points.push(pbot);
            if (outer_bounds.bottom <= pright.y && pright.y <= outer_bounds.top)
                valid_points.push(pright);
            if (outer_bounds.bottom <= pleft.y && pleft.y <= outer_bounds.top)
                valid_points.push(pleft);
            if (valid_points.length < 2)
                return empty();
            let validPoint = undefined;
            // figure out which point is in the correct direction
            let vAB = pB.sub(pA);
            let v0 = valid_points[0].sub(pA);
            if (vAB.dot(v0) > 0)
                validPoint = valid_points[0];
            let v1 = valid_points[1].sub(pA);
            if (vAB.dot(v1) > 0)
                validPoint = valid_points[1];
            if (validPoint === undefined)
                return empty();
            let arrow = arrow1(transf(pA), transf(validPoint), axopt.headsize)
                .apply(styleprofilelistF(styleprofiles, STYLE_KEYS.CARTESIAN_GRID_LINE));
            if (!obj_line.isDrawPoints) {
                return arrow;
            }
            let cA = circle(unit / 10).position(transf(pA)).fill('black').stroke('none');
            let cB = circle(unit / 10).position(transf(pB)).fill('black').stroke('none');
            return diagram_combine(cA, cB, arrow);
        }
    }
    assertNever("Unknown CartesianGridElement type: ", type);
}

const V2$3 = V2$5;
const GRAPH_TYPE = "Graph";
var GRAPH_ELEMENT_TYPE;
(function (GRAPH_ELEMENT_TYPE) {
    GRAPH_ELEMENT_TYPE["SCATTER"] = "Scatter";
    GRAPH_ELEMENT_TYPE["LINE"] = "Line";
    GRAPH_ELEMENT_TYPE["LINE_ARROW"] = "LineArrow";
})(GRAPH_ELEMENT_TYPE || (GRAPH_ELEMENT_TYPE = {}));
var ANNOTATION_ELEMENT_TYPE;
(function (ANNOTATION_ELEMENT_TYPE) {
    ANNOTATION_ELEMENT_TYPE["TEXT"] = "Text";
})(ANNOTATION_ELEMENT_TYPE || (ANNOTATION_ELEMENT_TYPE = {}));
function dg_Graph(obj) {
    var _a, _b;
    let elements = obj.elements.map(normalizeData);
    let axopt = getAxopt$1(obj, elements);
    let styleProfiles = (_a = obj.styleProfiles) !== null && _a !== void 0 ? _a : [];
    let isDrawGrid = (_b = getStyleProfilesMisc(styleProfiles, STYLE_KEYS.GRAPH_AXES, STYLE_MISC_KEYS.SHOW_GRID)) !== null && _b !== void 0 ? _b : false;
    let dg_grid = isDrawGrid ? generate_GraphGrid(obj, axopt) : empty();
    let dg_axes = generate_GraphAxes(obj, axopt);
    let dg_elements = obj.elements ? generate_GraphElements(elements, axopt, styleProfiles) : [];
    let dg_annotations = obj.annotations ? genetate_Annnotations(obj.annotations, axopt, styleProfiles) : [];
    return diagram_combine(dg_grid, dg_axes, ...dg_elements, ...dg_annotations);
}
function getAxopt$1(obj, elements) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    let dataBounds = getDataBounds$1(elements);
    let xbreak = (_b = getStyleProfilesMisc((_a = obj.styleProfiles) !== null && _a !== void 0 ? _a : [], STYLE_KEYS.GRAPH_AXES, STYLE_MISC_KEYS.X_AXIS_BREAK)) !== null && _b !== void 0 ? _b : false;
    let xrange = [dataBounds[0].x, dataBounds[1].x];
    let yrange = [dataBounds[0].y, dataBounds[1].y];
    if ((_c = obj.config) === null || _c === void 0 ? void 0 : _c.bounds) {
        let b = obj.config.bounds;
        xrange[0] = (_d = b.left) !== null && _d !== void 0 ? _d : xrange[0];
        xrange[1] = (_e = b.right) !== null && _e !== void 0 ? _e : xrange[1];
        yrange[0] = (_f = b.bottom) !== null && _f !== void 0 ? _f : yrange[0];
        yrange[1] = (_g = b.top) !== null && _g !== void 0 ? _g : yrange[1];
    }
    let xint = getTickInterval$1(xrange[0], xrange[1]);
    let yint = getTickInterval$1(yrange[0], yrange[1]);
    if (xbreak)
        xrange[0] -= xint;
    let noOvershoot = (_j = getStyleProfilesMisc((_h = obj.styleProfiles) !== null && _h !== void 0 ? _h : [], STYLE_KEYS.GRAPH_AXES, STYLE_MISC_KEYS.NO_GRAPH_BOUND_OVERSHOOT)) !== null && _j !== void 0 ? _j : false;
    if (!noOvershoot) {
        xrange[1] += xint / 2;
        yrange[1] += yint / 2;
    }
    let axopt = {
        xrange, yrange,
        //TODO: make this configurable
        bbox: [V2$3(0, 0), V2$3(600, 350)],
        ticksize: 16,
        headsize: 8,
        tick_label_offset: 8,
    };
    // calculate ticknumbers if config is given
    if ((_l = (_k = obj.config) === null || _k === void 0 ? void 0 : _k.interval) === null || _l === void 0 ? void 0 : _l.axis) {
        let axint = obj.config.interval.axis;
        if (axint.x)
            axopt.xticks = range_inc(xrange[0], xrange[1], axint.x);
        if (axint.y)
            axopt.yticks = range_inc(yrange[0], yrange[1], axint.y);
    }
    return axopt;
}
function getTickInterval$1(min, max) {
    let range = max - min;
    let range_order = Math.floor(Math.log10(range));
    let interval_to_try = [0.1, 0.15, 0.2, 0.5, 1.0].map(x => x * Math.pow(10, range_order));
    let tick_counts = interval_to_try.map(x => Math.floor(range / x));
    // choose the interval so that the number of ticks is between the biggest one but less than 10
    for (let i = 0; i < tick_counts.length; i++) {
        if (tick_counts[i] <= 10) {
            return interval_to_try[i];
        }
    }
    return interval_to_try.slice(-1)[0];
}
function generate_GraphGrid(obj, axopt) {
    var _a, _b, _c;
    let styleprofiles = (_a = obj.styleProfiles) !== null && _a !== void 0 ? _a : [];
    let xticks = axopt.xticks;
    let yticks = axopt.yticks;
    // calculate ticknumbers if config is given
    if ((_c = (_b = obj.config) === null || _b === void 0 ? void 0 : _b.interval) === null || _c === void 0 ? void 0 : _c.grid) {
        let gridint = obj.config.interval.grid;
        if (gridint.x)
            xticks = range_inc(axopt.xrange[0], axopt.xrange[1], gridint.x);
        if (gridint.y)
            yticks = range_inc(axopt.yrange[0], axopt.yrange[1], gridint.y);
    }
    return xygrid(Object.assign(Object.assign({}, axopt), { xticks, yticks }))
        .apply(styleprofilelistF(styleprofiles, STYLE_KEYS.GRAPH_GRID));
}
function attachEmpty$1(d) {
    let emp = curve([d.origin]);
    return diagram_combine(emp, d);
}
function generate_GraphAxes(obj, axopt) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    let unit = Math.max(axopt.bbox[1].x - axopt.bbox[0].x, axopt.bbox[1].y - axopt.bbox[0].y) * 0.1;
    let styleprofiles = (_a = obj.styleProfiles) !== null && _a !== void 0 ? _a : [];
    let ax = xycorneraxes(axopt);
    let xbreak = (_b = getStyleProfilesMisc(styleprofiles, STYLE_KEYS.GRAPH_AXES, STYLE_MISC_KEYS.X_AXIS_BREAK)) !== null && _b !== void 0 ? _b : false;
    if (xbreak)
        ax = xycorneraxes_xbreak(axopt);
    let [_ax, _xticks, _yticks] = ax.children;
    _ax = _ax.apply(styleprofilelistF(styleprofiles, STYLE_KEYS.GRAPH_AXES));
    _xticks = _xticks.apply(styleprofilelistF(styleprofiles, STYLE_KEYS.GRAPH_TICKS));
    _yticks = _yticks.apply(styleprofilelistF(styleprofiles, STYLE_KEYS.GRAPH_TICKS));
    ax = diagram_combine(_xticks, _yticks, _ax);
    let diagrams = [ax];
    const transf = axes_transform(axopt);
    if ((_c = obj.label) === null || _c === void 0 ? void 0 : _c.x) {
        let offset = (_e = (_d = obj.label.offset) === null || _d === void 0 ? void 0 : _d.x) !== null && _e !== void 0 ? _e : 0;
        let xlabel = text(obj.label.x)
            .move_origin_text('top-center')
            .position(ax.get_anchor('bottom-center'))
            .translate(V2$3(0, -unit))
            .translate(V2$3(0, unit * offset))
            .apply(styleprofilelistF(styleprofiles, STYLE_KEYS.GENERAL_HEADING))
            .apply(attachEmpty$1);
        diagrams.push(xlabel);
    }
    if ((_f = obj.label) === null || _f === void 0 ? void 0 : _f.y) {
        let offset = (_h = (_g = obj.label.offset) === null || _g === void 0 ? void 0 : _g.y) !== null && _h !== void 0 ? _h : 0;
        let ylabel = text(obj.label.y)
            .textangle(-Math.PI / 2)
            .move_origin_text('top-center')
            .position(ax.get_anchor('center-left'))
            .translate(V2$3(-1.5 * unit, 0))
            .translate(V2$3(unit * offset, 0))
            .apply(styleprofilelistF(styleprofiles, STYLE_KEYS.GENERAL_HEADING))
            .apply(attachEmpty$1);
        diagrams.push(ylabel);
    }
    if ((_j = obj.label) === null || _j === void 0 ? void 0 : _j.title) {
        let offset = (_l = (_k = obj.label.offset) === null || _k === void 0 ? void 0 : _k.title) !== null && _l !== void 0 ? _l : 0;
        let titletext = obj.label.title;
        let title;
        if (titletext.includes('\n')) {
            titletext = titletext.replace(/\n/g, '[br]');
            title = multiline_bb(titletext);
        }
        else {
            title = text(titletext);
        }
        title = title
            .move_origin_text('top-center')
            .position(ax.get_anchor('top-center'))
            .translate(V2$3(0, 1.5 * unit))
            .translate(V2$3(0, unit * offset))
            .apply(styleprofilelistF(styleprofiles, STYLE_KEYS.GENERAL_HEADING))
            .apply(attachEmpty$1);
        diagrams.push(title);
    }
    if ((_m = obj.label) === null || _m === void 0 ? void 0 : _m.xvar) {
        let xvarname = text(obj.label.xvar)
            .move_origin_text('center-left')
            .position(V2$3(axopt.xrange[1], axopt.yrange[0]).apply(transf))
            .translate(V2$3(unit * 0.2, 0))
            .apply(styleprofilelistF(styleprofiles, STYLE_KEYS.GENERAL_VARIABLE))
            .apply(attachEmpty$1);
        diagrams.push(xvarname);
    }
    if ((_o = obj.label) === null || _o === void 0 ? void 0 : _o.yvar) {
        let yvarname = text(obj.label.yvar)
            .move_origin_text('bottom-center')
            .position(V2$3(axopt.xrange[0], axopt.yrange[1]).apply(transf))
            .translate(V2$3(0, unit * 0.2))
            .apply(styleprofilelistF(styleprofiles, STYLE_KEYS.GENERAL_VARIABLE))
            .apply(attachEmpty$1);
        diagrams.push(yvarname);
    }
    return diagram_combine(...diagrams);
}
function generate_GraphElements(elements, axopt, styleProfiles) {
    return elements.map((e) => {
        return dg_GraphElement(e, axopt, styleProfiles);
    });
}
function genetate_Annnotations(annotations, axopt, styleProfiles) {
    return annotations.map((e) => {
        return dg_AnnotationElement(e, axopt, styleProfiles);
    });
}
function dg_GraphElement(elem, axopt, styleProfiles) {
    var _a, _b;
    let bbox = axopt.bbox;
    let unit = Math.max(bbox[1].x - bbox[0].x, bbox[1].y - bbox[0].y) * 0.1;
    let transf = axes_transform(axopt);
    if (elem.styleProfiles)
        styleProfiles = [...styleProfiles, ...elem.styleProfiles];
    switch (elem.type) {
        case GRAPH_ELEMENT_TYPE.SCATTER: {
            let r = unit * 0.05;
            let circs = elem.vecdata.map((v) => circle(r).fill('black').position(transf(v)));
            return diagram_combine(...circs);
        }
        case GRAPH_ELEMENT_TYPE.LINE: {
            let isSmooth = (_a = getStyleProfilesMisc(styleProfiles, STYLE_KEYS.GRAPH_LINE, STYLE_MISC_KEYS.LINE_GRAPH_CUBIC_SPLINE)) !== null && _a !== void 0 ? _a : false;
            let data = elem.vecdata;
            if (isSmooth)
                data = cubic_spline(data);
            let linegraph = curve(data.map(transf))
                .apply(styleprofilelistF(styleProfiles, STYLE_KEYS.GRAPH_LINE));
            return linegraph;
        }
        case GRAPH_ELEMENT_TYPE.LINE_ARROW: {
            let isSmooth = (_b = getStyleProfilesMisc(styleProfiles, STYLE_KEYS.GRAPH_LINE, STYLE_MISC_KEYS.LINE_GRAPH_CUBIC_SPLINE)) !== null && _b !== void 0 ? _b : false;
            let data = elem.vecdata;
            if (isSmooth)
                data = cubic_spline(data);
            let linegraph = curve(data.map(transf))
                .apply(styleprofilelistF(styleProfiles, STYLE_KEYS.GRAPH_LINE));
            let linearrow = linegraph.apply(add_arrow(axopt.headsize))
                .apply(styleprofilelistF(styleProfiles, [STYLE_KEYS.GRAPH_AXES, STYLE_KEYS.GRAPH_LINE]));
            return linearrow;
        }
    }
    assertNever("Unknown Graph Element type: ", elem.type);
}
function dg_AnnotationElement(elem, axopt, styleProfiles) {
    // let bbox = axopt.bbox!;
    // let unit = Math.max(bbox[1].x - bbox[0].x, bbox[1].y - bbox[0].y) * 0.1;
    let transf = axes_transform(axopt);
    if (elem.styleProfiles)
        styleProfiles = [...styleProfiles, ...elem.styleProfiles];
    switch (elem.type) {
        case ANNOTATION_ELEMENT_TYPE.TEXT: {
            let text$1 = text(String(elem.value))
                .move_origin_text('center-center')
                .position(transf(V2$3(elem.x, elem.y)))
                .apply(styleprofilelistF(styleProfiles, [STYLE_KEYS.GENERAL_DIAGRAM, STYLE_KEYS.GRAPH_ANNOTATION_TEXT]));
            let textbg = text$1.copy()
                .apply(styleprofilelistF(styleProfiles, STYLE_KEYS.GRAPH_ANNOTATION_TEXTBG));
            return diagram_combine(textbg, text$1);
        }
    }
    assertNever("Unknown Graph Element type: ", elem.type);
}
function getDataBounds$1(data) {
    let flattendata = data.flatMap((e) => e.vecdata);
    let xdata = flattendata.map((v) => v.x);
    let ydata = flattendata.map((v) => v.y);
    let minx = Math.min(...xdata);
    let maxx = Math.max(...xdata);
    let miny = Math.min(...ydata);
    let maxy = Math.max(...ydata);
    return [V2$3(minx, miny), V2$3(maxx, maxy)];
}
function normalizeData(e) {
    if (e.data.xy) {
        let vecdata = e.data.xy.map(([x, y]) => V2$3(x, y));
        return Object.assign(Object.assign({}, e), { vecdata });
    }
    if (e.data.x && e.data.y) {
        let vecdata = e.data.x.map((x, i) => V2$3(x, e.data.y[i]));
        return Object.assign(Object.assign({}, e), { vecdata });
    }
    return Object.assign(Object.assign({}, e), { vecdata: [] });
}

const dgeo = geo_construct;
const GEOMETRIC_CONSTRUCTION_TYPE = "GeometricConstruction";
// Point                      : number, number
// PointCollinearExtendLength : Point, Point, number
// PointCollinearFraction     : Point, Point, number
// PointOnLineAtDistanceFrom  : Line, number, Point
// PointAtLineIntersection  : Line, Line
// LineFromPoints             : Point, Point
// LineFromAngle              : Point, number
// LineParallelAtPoint        : Line, Point
// LinePerpendicularAtPoint   : Line, Point
// LineRotatedAtPoint         : Line, Point, number
var SketchElementType;
(function (SketchElementType) {
    SketchElementType["Value"] = "Value";
    SketchElementType["Point"] = "Point";
    SketchElementType["PointCollinearExtendLength"] = "PointCollinearExtendLength";
    SketchElementType["PointCollinearFraction"] = "PointCollinearFraction";
    SketchElementType["PointOnLineAtDistanceFrom"] = "PointOnLineAtDistanceFrom";
    SketchElementType["PointOnLineWithX"] = "PointOnLineWithX";
    SketchElementType["PointOnLineWithY"] = "PointOnLineWithY";
    SketchElementType["PointAtLineIntersection"] = "PointAtLineIntersection";
    // Lines
    SketchElementType["LineFromPoints"] = "LineFromPoints";
    SketchElementType["LineFromAngle"] = "LineFromAngle";
    SketchElementType["LineParallelAtPoint"] = "LineParallelAtPoint";
    SketchElementType["LinePerpendicularAtPoint"] = "LinePerpendicularAtPoint";
    SketchElementType["LineRotatedAtPoint"] = "LineRotatedAtPoint";
    // Abbrev
    SketchElementType["LineParallel"] = "LineParallel";
    SketchElementType["LinePerpendicular"] = "LinePerpendicular";
    SketchElementType["LineRotated"] = "LineRotated";
})(SketchElementType || (SketchElementType = {}));
var ObjectElementType;
(function (ObjectElementType) {
    ObjectElementType["LineSegment"] = "LineSegment";
    ObjectElementType["Arrow"] = "Arrow";
    ObjectElementType["Arrow2"] = "Arrow2";
})(ObjectElementType || (ObjectElementType = {}));
var AnnotationElementType;
(function (AnnotationElementType) {
    AnnotationElementType["Angle"] = "Angle";
    // points     : [Point, Point, Point]
    // text       : string
    // textoffset : number | [number,number]
    AnnotationElementType["RightAngle"] = "RightAngle";
    // points     : [Point, Point, Point]
    AnnotationElementType["ParallelMark"] = "ParallelMark";
    // segment    : [Point, Point]
    // count      : number
    AnnotationElementType["CongruenceMark"] = "CongruenceMark";
    // segment    : [Point, Point]
    // count      : number
})(AnnotationElementType || (AnnotationElementType = {}));
function saveMathEvalWithCtx(expr, ctx) {
    let valueCtx = {};
    for (let key in ctx) {
        if (typeof ctx[key] === "number")
            valueCtx[key] = ctx[key];
    }
    // replace all the keys with their values
    for (let key in valueCtx) {
        // only replace `key`s that are surrounded by non-alphanumeric characters
        expr = expr.replace(new RegExp(`(?<!\w)${key}(?!\w)`, 'g'), valueCtx[key].toString());
    }
    return saveMathEval(expr);
}
function saveMathEval(expr) {
    expr = expr.trimStart().trimEnd();
    const allowed = /^[\d+\-\/*.)(\ ]+$/;
    if (!allowed.test(expr)) {
        console.error("Invalid expression: ", expr);
        return undefined;
    }
    try {
        const fn = new Function('return ' + expr);
        return fn();
    }
    catch (e) {
        console.error("Error evaluating expression: ", expr, e);
        return undefined;
    }
}
function dg_GeometricConstruction(obj) {
    var _a, _b, _c;
    let ctx = generate_context(obj);
    let pad = obj.sketchPadding;
    let preview = get_preview_diagram(ctx, pad);
    if (obj.objects == undefined)
        return preview;
    // obj is defined
    // do initial pass to get the bounding box (needed to determine the size of objects like arrow)
    let preview_bbox = preview.bounding_box();
    let dg_obj_ = diagram_combine(...generate_objects(obj.objects, ctx, preview_bbox, (_a = obj.styleProfiles) !== null && _a !== void 0 ? _a : []));
    let bbox = dg_obj_.bounding_box();
    let dg_obj = generate_objects(obj.objects, ctx, bbox, (_b = obj.styleProfiles) !== null && _b !== void 0 ? _b : []);
    let dg_annotation = obj.annotations ?
        generate_annotation(obj.annotations, ctx, bbox, (_c = obj.styleProfiles) !== null && _c !== void 0 ? _c : []) : [];
    let dg_preview = !obj.isFinal ? [preview.opacity(0.2)] : [];
    return diagram_combine(...dg_preview, ...dg_obj, ...dg_annotation);
}
function generate_context(obj) {
    let sketch = obj.sketch;
    let ctx = {};
    let names = Object.keys(sketch);
    for (let name of names) {
        let argstr = sketch[name];
        let args = argstr.split(", ");
        if (args.length < 1)
            continue;
        let funcname = args[0];
        if (!isStringInEnum(funcname, SketchElementType)) {
            console.error("Unknown sketch element type: ", funcname);
            continue;
        }
        let obj = dg_geomSketch(args, ctx);
        if (obj === undefined) {
            console.error("Failed to construct sketch element: ", argstr);
            continue;
        }
        ctx[name] = obj;
    }
    return ctx;
}
function generate_objects(objstr, ctx, bbox, styleProfiles) {
    let diagrams = [];
    for (let argstr of objstr) {
        let args = argstr.split(", ");
        if (args.length < 1)
            continue;
        let objname = args[0];
        if (!isStringInEnum(objname, ObjectElementType)) {
            console.error("Unknown object type: ", objname);
            continue;
        }
        let diag = dg_geomObject(args, ctx, bbox);
        if (diag === undefined) {
            console.error("Failed to construct object: ", argstr);
            continue;
        }
        diagrams.push(diag);
    }
    return diagrams;
}
function generate_annotation(annlist, ctx, bbox, styleProfiles) {
    let diagrams = [];
    for (let ann of annlist) {
        let diag = dg_geomAnnotation(ann, ctx, bbox, styleProfiles);
        if (diag === undefined) {
            console.error("Failed to construct annotation: ", ann);
            continue;
        }
        diagrams.push(diag);
    }
    return diagrams;
}
function parse_offset(str) {
    var _a, _b, _c;
    str = str.toString();
    if (str.includes(",")) {
        let numarr = str.split(",").map(saveMathEval);
        return V2$5((_a = numarr[0]) !== null && _a !== void 0 ? _a : 0, (_b = numarr[1]) !== null && _b !== void 0 ? _b : 0);
    }
    else {
        return (_c = saveMathEval(str)) !== null && _c !== void 0 ? _c : 0;
    }
}
function parse_listofPoints(str, ctx) {
    if (str === undefined)
        return undefined;
    let pointnames = str.split(", ");
    let points = pointnames.map((name) => ctx[name]);
    if (points.includes(undefined))
        return undefined;
    return points;
}
function is_containAlphabetic(str) {
    return /[a-zA-Z]/.test(str);
}
function dg_geomAnnotation(annotation, ctx, bbox, styleProfiles) {
    var _a, _b, _c, _d, _f;
    let [lower, upper] = bbox;
    let unit = Math.max(upper.x - lower.x, upper.y - lower.y) * 0.1;
    try {
        switch (annotation.type) {
            case AnnotationElementType.Angle: {
                let points = parse_listofPoints(annotation['points'], ctx);
                if (points === undefined)
                    return undefined;
                // TODO: measure the angle
                let text = (_a = annotation['text']) !== null && _a !== void 0 ? _a : "x";
                text = str_latex_to_unicode(text);
                let arcradius = (_b = annotation['arcradius']) !== null && _b !== void 0 ? _b : 0;
                let textoffsetstr = (_c = annotation['textoffset']) !== null && _c !== void 0 ? _c : "1";
                let textoffset = parse_offset(textoffsetstr);
                if (is_containAlphabetic(text)) {
                    // assume it's a variable
                    return angle(points, text, arcradius, textoffset)
                        .text_totext()
                        .apply(styleprofilelistF(styleProfiles, STYLE_KEYS.GENERAL_VARIABLE));
                }
                else {
                    return angle(points, text, arcradius, textoffset)
                        .text_totext()
                        .apply(styleprofilelistF(styleProfiles, STYLE_KEYS.GENERAL_DIAGRAM));
                }
            }
            case AnnotationElementType.RightAngle: {
                let points = parse_listofPoints(annotation['points'], ctx);
                if (points === undefined)
                    return undefined;
                let size = unit / 3;
                return right_angle(points, size);
            }
            case AnnotationElementType.ParallelMark: {
                // segment    : [Point, Point]
                // count      : number
                let points = parse_listofPoints(annotation['segment'], ctx);
                if (points === undefined)
                    return undefined;
                let count = (_d = annotation['count']) !== null && _d !== void 0 ? _d : 1;
                let size = unit / 4;
                let gap = unit / 6;
                let arrow_angle = to_radian(30);
                return parallel_mark(...points, count, size, gap, arrow_angle);
            }
            case AnnotationElementType.CongruenceMark: {
                // segment    : [Point, Point]
                // count      : number
                let points = parse_listofPoints(annotation['segment'], ctx);
                if (points === undefined)
                    return undefined;
                let count = (_f = annotation['count']) !== null && _f !== void 0 ? _f : 1;
                let size = unit / 4;
                let gap = unit / 6;
                return congruence_mark(...points, count, size, gap);
            }
        }
        assertNever("Unknown GeometryConstruction type: ", annotation.type);
    }
    catch (_e) {
        return undefined;
    }
}
function dg_geomObject(args, ctx, bbox, _styleProfiles) {
    let [lower, upper] = bbox;
    let unit = Math.max(upper.x - lower.x, upper.y - lower.y) * 0.1;
    try {
        let objname = args[0];
        switch (objname) {
            case ObjectElementType.LineSegment: {
                let p1 = ctx[args[1]];
                let p2 = ctx[args[2]];
                if (p1 === undefined || p2 === undefined)
                    return undefined;
                return line$1(p1, p2);
            }
            case ObjectElementType.Arrow: {
                let p1 = ctx[args[1]];
                let p2 = ctx[args[2]];
                if (p1 === undefined || p2 === undefined)
                    return undefined;
                let arrowheadsize = unit / 8;
                return arrow1(p1, p2, arrowheadsize).fill('black');
            }
            case ObjectElementType.Arrow2: {
                let p1 = ctx[args[1]];
                let p2 = ctx[args[2]];
                if (p1 === undefined || p2 === undefined)
                    return undefined;
                let arrowheadsize = unit / 8;
                return arrow2(p1, p2, arrowheadsize).fill('black');
            }
        }
        assertNever("Unknown GeometryConstruction type: ", objname);
    }
    catch (_e) {
        return undefined;
    }
}
function tryParseValue(str, ctx) {
    if (ctx[str] !== undefined && typeof ctx[str] !== "number")
        return undefined;
    return saveMathEvalWithCtx(str, ctx);
}
function dg_geomSketch(args, ctx) {
    // intersect(o1 : GeoObj, o2 : GeoObj) : Vector2[]
    // point_collinear_fraction(p1 : Vector2, p2 : Vector2, t : number) : Vector2
    // line(p : Vector2, dir : Vector2) : GeoLine
    // line_from_slope(p : Vector2, slope : number) : GeoLine
    try {
        let funcname = args[0];
        switch (funcname) {
            case SketchElementType.Value: {
                let val = tryParseValue(args[1], ctx);
                if (val === undefined)
                    return undefined;
                return val;
            }
            case SketchElementType.Point: {
                let x = tryParseValue(args[1], ctx);
                let y = tryParseValue(args[2], ctx);
                if (x === undefined || y === undefined)
                    return undefined;
                return V2$5(x, y);
            }
            case SketchElementType.PointCollinearExtendLength: {
                // point_collinear_extend_length(p1 : Vector2, p2 : Vector2, len : number) : Vector2
                let p1 = ctx[args[1]];
                let p2 = ctx[args[2]];
                let len = tryParseValue(args[3], ctx);
                if (p1 === undefined || p2 === undefined || len === undefined)
                    return undefined;
                return dgeo.point_collinear_extend_length(p1, p2, len);
            }
            case SketchElementType.PointCollinearFraction: {
                // point_collinear_fraction(p1 : Vector2, p2 : Vector2, t : number) : Vector2 
                let p1 = ctx[args[1]];
                let p2 = ctx[args[2]];
                let t = tryParseValue(args[3], ctx);
                if (p1 === undefined || p2 === undefined || t === undefined)
                    return undefined;
                return dgeo.point_collinear_fraction(p1, p2, t);
            }
            case SketchElementType.PointOnLineAtDistanceFrom: {
                // point_onLine_atDistance_from(l : GeoLine, d : number, p : Vector2) : Vector2
                let l = ctx[args[1]];
                let d = tryParseValue(args[2], ctx);
                let p = ctx[args[3]];
                if (l === undefined || d === undefined || p === undefined)
                    return undefined;
                return dgeo.point_onLine_atDistance_from(l, d, p);
            }
            case SketchElementType.PointOnLineWithX: {
                // point_onLine_with_x(l : GeoLine, x : number) : Vector2 {
                let l = ctx[args[1]];
                let x = tryParseValue(args[2], ctx);
                if (l === undefined || x === undefined)
                    return undefined;
                return dgeo.point_onLine_with_x(l, x);
            }
            case SketchElementType.PointOnLineWithY: {
                // point_onLine_with_y(l : GeoLine, y : number) : Vector2 {
                let l = ctx[args[1]];
                let y = tryParseValue(args[2], ctx);
                if (l === undefined || y === undefined)
                    return undefined;
                return dgeo.point_onLine_with_y(l, y);
            }
            case SketchElementType.PointAtLineIntersection: {
                // line_intersection(l1 : GeoLine, l2 : GeoLine) : Vector2
                let l1 = ctx[args[1]];
                let l2 = ctx[args[2]];
                if (l1 === undefined || l2 === undefined)
                    return undefined;
                return dgeo.line_intersection(l1, l2);
            }
            // Lines
            case SketchElementType.LineFromPoints: {
                // line_from_points(p1 : Vector2, p2 : Vector2) : GeoLine
                let p1 = ctx[args[1]];
                let p2 = ctx[args[2]];
                if (p1 === undefined || p2 === undefined)
                    return undefined;
                return dgeo.line_from_points(p1, p2);
            }
            case SketchElementType.LineFromAngle: {
                // line_from_angle(p : Vector2, angle : number) : GeoLine
                let p = ctx[args[1]];
                let angle = tryParseValue(args[2], ctx);
                if (p === undefined || angle === undefined)
                    return undefined;
                return dgeo.line_from_angle(p, to_radian(angle));
            }
            case SketchElementType.LineParallel:
            case SketchElementType.LineParallelAtPoint: {
                // line_parallel_at_point(l : GeoLine, p : Vector2) : GeoLine
                let l = ctx[args[1]];
                let p = ctx[args[2]];
                if (l === undefined || p === undefined)
                    return undefined;
                return dgeo.line_parallel_at_point(l, p);
            }
            case SketchElementType.LinePerpendicular:
            case SketchElementType.LinePerpendicularAtPoint: {
                // line_perpendicular_at_point(l : GeoLine, p : Vector2) : GeoLine
                let l = ctx[args[1]];
                let p = ctx[args[2]];
                if (l === undefined || p === undefined)
                    return undefined;
                return dgeo.line_perpendicular_at_point(l, p);
            }
            case SketchElementType.LineRotated:
            case SketchElementType.LineRotatedAtPoint: {
                // line_rotated_at_point(l : GeoLine, p : Vector2, angle : number) : GeoLine
                let l = ctx[args[1]];
                let angle = tryParseValue(args[2], ctx);
                let p = ctx[args[3]];
                if (l === undefined || p === undefined || angle === undefined)
                    return undefined;
                return dgeo.line_rotated_at_point(l, to_radian(angle), p);
            }
        }
        assertNever("Unknown GeometryConstruction type: ", funcname);
    }
    catch (_e) {
        return undefined;
    }
}

const V2$2 = V2$5;
const BOX_PLOT_TYPE = "BoxPlot";
function dg_BoxPlot(obj) {
    var _a;
    // let data = obj.data.map(calcQs);
    let baropt = getAxopt(obj);
    let styleProfiles = (_a = obj.styleProfiles) !== null && _a !== void 0 ? _a : [];
    // let isDrawGrid = getStyleProfilesMisc(styleProfiles, K.GRAPH_AXES, M.SHOW_GRID) ?? false;
    // let dg_grid = isDrawGrid ? generate_GraphGrid(obj, axopt) : dg.empty();
    let dg_axes = generate_Axes(obj, baropt, styleProfiles);
    let dg_boxplots = obj.data ? generate_BoxPlots(obj.data, baropt, styleProfiles) : [];
    // let dg_elements = obj.elements ? generate_GraphElements(elements, axopt, styleProfiles) : [];
    // let dg_annotations = obj.annotations ? genetate_Annnotations(obj.annotations, axopt, styleProfiles) : [];
    return diagram_combine(dg_axes, ...dg_boxplots);
}
function attachEmpty(d) {
    let emp = curve([d.origin]);
    return diagram_combine(emp, d);
}
function generate_Axes(obj, baropt, styleProfiles) {
    var _a, _b, _c;
    let diagrams = [];
    let ax = axes(baropt)
        .apply(styleprofilelistF(styleProfiles, [STYLE_KEYS.GENERAL_DIAGRAM, STYLE_KEYS.GRAPH_AXES]));
    diagrams.push(ax);
    let unit = (baropt.bbox[1].x - baropt.bbox[0].x) * 0.1;
    if ((_a = obj.label) === null || _a === void 0 ? void 0 : _a.x) {
        let offset = (_c = (_b = obj.label.offset) === null || _b === void 0 ? void 0 : _b.x) !== null && _c !== void 0 ? _c : 0;
        let xlabel = text(obj.label.x)
            .move_origin_text('top-center')
            .position(ax.get_anchor('bottom-center'))
            .translate(V2$2(0, -unit))
            .translate(V2$2(0, unit * offset))
            .apply(styleprofilelistF(styleProfiles, STYLE_KEYS.GENERAL_HEADING))
            .apply(attachEmpty);
        diagrams.push(xlabel);
    }
    return diagram_combine(...diagrams);
}
function generate_BoxPlots(data, baropt, styleProfiles) {
    data.reverse();
    let _unit = (baropt.bbox[1].x - baropt.bbox[0].x) * 0.1;
    const size = _unit;
    const gap = _unit;
    // const transf = dg.graph.axes_transform(dg.boxplot.to_ax_options(baropt))
    let boxplots = data.map((d, i) => {
        let Qs = d.Qs;
        let y = gap + (size / 2) + (size + gap) * i;
        return plotQ(Qs, y, size, baropt)
            .apply(styleprofilelistF(styleProfiles, STYLE_KEYS.BOX_PLOT_BOX));
    });
    let labels = data.map((d, i) => {
        let y = gap + (size / 2) + (size + gap) * i;
        return text(d.label).move_origin_text('center-right').position(V2$2(baropt.bbox[0].x, y))
            .apply(styleprofilelistF(styleProfiles, [STYLE_KEYS.GENERAL_DIAGRAM, STYLE_KEYS.BOX_PLOT_LABEL]));
    });
    return [...boxplots, ...labels];
}
function getAxopt(obj) {
    let xrange = getDataBounds(obj.data);
    let int = getTickInterval(xrange[0], xrange[1]);
    xrange[0] -= int / 2;
    xrange[1] += int / 2;
    let bar_opt = {
        range: xrange,
        // ticks : range_inc(3,19,2),
        bbox: [V2$2(0, 0), V2$2(600, 400)],
        ticksize: 16,
        headsize: 8,
        tick_label_offset: 8,
        orientation: "x",
    };
    return bar_opt;
}
function getDataBounds(datalist) {
    let min = Math.min(...datalist.map(d => d.Qs[0]));
    let max = Math.max(...datalist.map(d => d.Qs[4]));
    return [min, max];
}
function getTickInterval(min, max) {
    let range = max - min;
    let range_order = Math.floor(Math.log10(range));
    let interval_to_try = [0.1, 0.15, 0.2, 0.5, 1.0].map(x => x * Math.pow(10, range_order));
    let tick_counts = interval_to_try.map(x => Math.floor(range / x));
    // choose the interval so that the number of ticks is between the biggest one but less than 10
    for (let i = 0; i < tick_counts.length; i++) {
        if (tick_counts[i] <= 10) {
            return interval_to_try[i];
        }
    }
    return interval_to_try.slice(-1)[0];
}

const V2$1 = V2$5;
const NUMBERLINE_TYPE = "Numberline";
function dg_Numberline(obj) {
    var _a, _b;
    let ov = (typeof obj.overshoot === "number") ? { left: obj.overshoot, right: obj.overshoot } : obj.overshoot;
    let unit = (obj.max + ov.right - obj.min - ov.left) / 10;
    let styleProfiles = (_a = obj.styleProfiles) !== null && _a !== void 0 ? _a : [];
    let ax = ((_b = obj.drawArrow) !== null && _b !== void 0 ? _b : true) ?
        axis(obj.min - ov.left, obj.max + ov.right, unit / 8) :
        line$1(V2$1(obj.min - ov.left, 0), V2$1(obj.max + ov.right, 0));
    ax = ax.apply(styleprofilelistF(styleProfiles, STYLE_KEYS.GRAPH_AXES));
    let minorTicks = range_inc(obj.min, obj.max, obj.tickStep.minor);
    let majorTicks = range_inc(obj.min, obj.max, obj.tickStep.major);
    let numberedTicks = obj.tickStep.major ? numbered_ticks(majorTicks, unit / 3, unit / 4) : empty();
    numberedTicks = numberedTicks.apply(styleprofilelistF(styleProfiles, STYLE_KEYS.GRAPH_TICKS));
    let emptyTicks = obj.tickStep.minor ? ticks(minorTicks, unit / 3) : empty();
    emptyTicks = emptyTicks.apply(styleprofilelistF(styleProfiles, STYLE_KEYS.GRAPH_TICKS));
    return diagram_combine(ax, numberedTicks, emptyTicks);
}

const V2 = V2$5;
const DIAGRAM_TYPE = "Diagram";
function dg_Diagram(data) {
    var _a, _b;
    let diagrams = [];
    let ctx = {};
    for (let e of data.elements) {
        let obj = parseElement(e, ctx, (_a = data.styleProfiles) !== null && _a !== void 0 ? _a : []);
        // if (obj === undefined) break; // stop if there is an error
        if (obj === undefined) {
            throw new Error(`Error parsing element: ${e.name} (${e.object})`);
        }
        ctx[e.name] = obj;
        if (e.isHidden)
            continue;
        if (obj instanceof Diagram)
            diagrams.push(obj);
    }
    return diagram_combine(...diagrams)
        .apply(styleprofilelistF((_b = data.styleProfiles) !== null && _b !== void 0 ? _b : [], STYLE_KEYS.GENERAL_DIAGRAM));
}
function isV2String(str) {
    // "(x;y)"
    if (typeof str !== 'string')
        return false;
    let stripped = str.trim();
    if (stripped[0] !== '(' || stripped[stripped.length - 1] !== ')')
        return false;
    if (stripped.indexOf(';') === -1)
        return false;
    return true;
}
function parseV2String(str, ctx) {
    let stripped = str.trim();
    let [x, y] = stripped.slice(1, -1).split(';').map(parseFloat);
    let xval = parseValue(x, ctx);
    let yval = parseValue(y, ctx);
    if (typeof xval !== 'number') {
        throw new Error(`Invalid x value in V2 string: "${x}" is not a number (${str})`);
    }
    if (typeof yval !== 'number') {
        throw new Error(`Invalid y value in V2 string: "${y}" is not a number (${str})`);
    }
    return V2(xval, yval);
}
function parseValue(val, ctx) {
    // TODO : Expression Calculation
    if (val in ctx)
        return ctx[val];
    if (isV2String(val))
        return parseV2String(val, ctx);
    // otherwise, just return the value
    return val;
}
function parseElement(elementData, ctx, styleProfiles) {
    var _a, _b, _c;
    let obj;
    if (elementData.object in ctx) {
        obj = ctx[elementData.object];
    }
    else {
        if (typeof dg[elementData.object] !== 'function') {
            throw new Error(`Invalid object: ${elementData.object}`);
        }
        elementData.params = (_a = elementData.params) !== null && _a !== void 0 ? _a : [];
        if (!Array.isArray(elementData.params))
            elementData.params = [elementData.params];
        let parsedParams = ((_b = elementData.params) !== null && _b !== void 0 ? _b : []).map(p => parseValue(p, ctx));
        obj = dg[elementData.object](...parsedParams);
        if (obj === undefined)
            return undefined;
    }
    // apply styleProfiles if obj is a Diagram
    if (obj instanceof Diagram)
        obj = obj.apply(styleprofilelistF(styleProfiles, STYLE_KEYS.GENERAL_DIAGRAM));
    let objAfterMethods = doMethods(obj, (_c = elementData.methods) !== null && _c !== void 0 ? _c : [], ctx);
    return objAfterMethods;
}
function doMethods(obj, methods, ctx) {
    for (let method of methods) {
        obj = doMethod(obj, method, ctx);
        if (obj === undefined)
            return undefined;
    }
    return obj;
}
function doMethod(obj, method, ctx) {
    var _a;
    if (typeof obj[method.method] !== 'function') {
        throw new Error(`Invalid method: ${method.method}`);
    }
    let parsedParams = ((_a = method.params) !== null && _a !== void 0 ? _a : []).map(p => parseValue(p, ctx));
    return obj[method.method](...parsedParams);
}

var constructions = /*#__PURE__*/Object.freeze({
    __proto__: null,
    BOX_PLOT_TYPE: BOX_PLOT_TYPE,
    CARTESIAN_GRID_TYPE: CARTESIAN_GRID_TYPE,
    DIAGRAM_TYPE: DIAGRAM_TYPE,
    GEOMETRIC_CONSTRUCTION_TYPE: GEOMETRIC_CONSTRUCTION_TYPE,
    GRAPH_TYPE: GRAPH_TYPE,
    NUMBERLINE_TYPE: NUMBERLINE_TYPE,
    dg_BoxPlot: dg_BoxPlot,
    dg_CartesianGrid: dg_CartesianGrid,
    dg_Diagram: dg_Diagram,
    dg_GeometricConstruction: dg_GeometricConstruction,
    dg_Graph: dg_Graph,
    dg_Numberline: dg_Numberline
});

/*! js-yaml 4.1.0 https://github.com/nodeca/js-yaml @license MIT */
function isNothing(subject) {
  return (typeof subject === 'undefined') || (subject === null);
}


function isObject(subject) {
  return (typeof subject === 'object') && (subject !== null);
}


function toArray(sequence) {
  if (Array.isArray(sequence)) return sequence;
  else if (isNothing(sequence)) return [];

  return [ sequence ];
}


function extend(target, source) {
  var index, length, key, sourceKeys;

  if (source) {
    sourceKeys = Object.keys(source);

    for (index = 0, length = sourceKeys.length; index < length; index += 1) {
      key = sourceKeys[index];
      target[key] = source[key];
    }
  }

  return target;
}


function repeat(string, count) {
  var result = '', cycle;

  for (cycle = 0; cycle < count; cycle += 1) {
    result += string;
  }

  return result;
}


function isNegativeZero(number) {
  return (number === 0) && (Number.NEGATIVE_INFINITY === 1 / number);
}


var isNothing_1      = isNothing;
var isObject_1       = isObject;
var toArray_1        = toArray;
var repeat_1         = repeat;
var isNegativeZero_1 = isNegativeZero;
var extend_1         = extend;

var common = {
	isNothing: isNothing_1,
	isObject: isObject_1,
	toArray: toArray_1,
	repeat: repeat_1,
	isNegativeZero: isNegativeZero_1,
	extend: extend_1
};

// YAML error class. http://stackoverflow.com/questions/8458984


function formatError(exception, compact) {
  var where = '', message = exception.reason || '(unknown reason)';

  if (!exception.mark) return message;

  if (exception.mark.name) {
    where += 'in "' + exception.mark.name + '" ';
  }

  where += '(' + (exception.mark.line + 1) + ':' + (exception.mark.column + 1) + ')';

  if (!compact && exception.mark.snippet) {
    where += '\n\n' + exception.mark.snippet;
  }

  return message + ' ' + where;
}


function YAMLException$1(reason, mark) {
  // Super constructor
  Error.call(this);

  this.name = 'YAMLException';
  this.reason = reason;
  this.mark = mark;
  this.message = formatError(this, false);

  // Include stack trace in error object
  if (Error.captureStackTrace) {
    // Chrome and NodeJS
    Error.captureStackTrace(this, this.constructor);
  } else {
    // FF, IE 10+ and Safari 6+. Fallback for others
    this.stack = (new Error()).stack || '';
  }
}


// Inherit from Error
YAMLException$1.prototype = Object.create(Error.prototype);
YAMLException$1.prototype.constructor = YAMLException$1;


YAMLException$1.prototype.toString = function toString(compact) {
  return this.name + ': ' + formatError(this, compact);
};


var exception = YAMLException$1;

// get snippet for a single line, respecting maxLength
function getLine(buffer, lineStart, lineEnd, position, maxLineLength) {
  var head = '';
  var tail = '';
  var maxHalfLength = Math.floor(maxLineLength / 2) - 1;

  if (position - lineStart > maxHalfLength) {
    head = ' ... ';
    lineStart = position - maxHalfLength + head.length;
  }

  if (lineEnd - position > maxHalfLength) {
    tail = ' ...';
    lineEnd = position + maxHalfLength - tail.length;
  }

  return {
    str: head + buffer.slice(lineStart, lineEnd).replace(/\t/g, '→') + tail,
    pos: position - lineStart + head.length // relative position
  };
}


function padStart(string, max) {
  return common.repeat(' ', max - string.length) + string;
}


function makeSnippet(mark, options) {
  options = Object.create(options || null);

  if (!mark.buffer) return null;

  if (!options.maxLength) options.maxLength = 79;
  if (typeof options.indent      !== 'number') options.indent      = 1;
  if (typeof options.linesBefore !== 'number') options.linesBefore = 3;
  if (typeof options.linesAfter  !== 'number') options.linesAfter  = 2;

  var re = /\r?\n|\r|\0/g;
  var lineStarts = [ 0 ];
  var lineEnds = [];
  var match;
  var foundLineNo = -1;

  while ((match = re.exec(mark.buffer))) {
    lineEnds.push(match.index);
    lineStarts.push(match.index + match[0].length);

    if (mark.position <= match.index && foundLineNo < 0) {
      foundLineNo = lineStarts.length - 2;
    }
  }

  if (foundLineNo < 0) foundLineNo = lineStarts.length - 1;

  var result = '', i, line;
  var lineNoLength = Math.min(mark.line + options.linesAfter, lineEnds.length).toString().length;
  var maxLineLength = options.maxLength - (options.indent + lineNoLength + 3);

  for (i = 1; i <= options.linesBefore; i++) {
    if (foundLineNo - i < 0) break;
    line = getLine(
      mark.buffer,
      lineStarts[foundLineNo - i],
      lineEnds[foundLineNo - i],
      mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo - i]),
      maxLineLength
    );
    result = common.repeat(' ', options.indent) + padStart((mark.line - i + 1).toString(), lineNoLength) +
      ' | ' + line.str + '\n' + result;
  }

  line = getLine(mark.buffer, lineStarts[foundLineNo], lineEnds[foundLineNo], mark.position, maxLineLength);
  result += common.repeat(' ', options.indent) + padStart((mark.line + 1).toString(), lineNoLength) +
    ' | ' + line.str + '\n';
  result += common.repeat('-', options.indent + lineNoLength + 3 + line.pos) + '^' + '\n';

  for (i = 1; i <= options.linesAfter; i++) {
    if (foundLineNo + i >= lineEnds.length) break;
    line = getLine(
      mark.buffer,
      lineStarts[foundLineNo + i],
      lineEnds[foundLineNo + i],
      mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo + i]),
      maxLineLength
    );
    result += common.repeat(' ', options.indent) + padStart((mark.line + i + 1).toString(), lineNoLength) +
      ' | ' + line.str + '\n';
  }

  return result.replace(/\n$/, '');
}


var snippet = makeSnippet;

var TYPE_CONSTRUCTOR_OPTIONS = [
  'kind',
  'multi',
  'resolve',
  'construct',
  'instanceOf',
  'predicate',
  'represent',
  'representName',
  'defaultStyle',
  'styleAliases'
];

var YAML_NODE_KINDS = [
  'scalar',
  'sequence',
  'mapping'
];

function compileStyleAliases(map) {
  var result = {};

  if (map !== null) {
    Object.keys(map).forEach(function (style) {
      map[style].forEach(function (alias) {
        result[String(alias)] = style;
      });
    });
  }

  return result;
}

function Type$1(tag, options) {
  options = options || {};

  Object.keys(options).forEach(function (name) {
    if (TYPE_CONSTRUCTOR_OPTIONS.indexOf(name) === -1) {
      throw new exception('Unknown option "' + name + '" is met in definition of "' + tag + '" YAML type.');
    }
  });

  // TODO: Add tag format check.
  this.options       = options; // keep original options in case user wants to extend this type later
  this.tag           = tag;
  this.kind          = options['kind']          || null;
  this.resolve       = options['resolve']       || function () { return true; };
  this.construct     = options['construct']     || function (data) { return data; };
  this.instanceOf    = options['instanceOf']    || null;
  this.predicate     = options['predicate']     || null;
  this.represent     = options['represent']     || null;
  this.representName = options['representName'] || null;
  this.defaultStyle  = options['defaultStyle']  || null;
  this.multi         = options['multi']         || false;
  this.styleAliases  = compileStyleAliases(options['styleAliases'] || null);

  if (YAML_NODE_KINDS.indexOf(this.kind) === -1) {
    throw new exception('Unknown kind "' + this.kind + '" is specified for "' + tag + '" YAML type.');
  }
}

var type = Type$1;

/*eslint-disable max-len*/





function compileList(schema, name) {
  var result = [];

  schema[name].forEach(function (currentType) {
    var newIndex = result.length;

    result.forEach(function (previousType, previousIndex) {
      if (previousType.tag === currentType.tag &&
          previousType.kind === currentType.kind &&
          previousType.multi === currentType.multi) {

        newIndex = previousIndex;
      }
    });

    result[newIndex] = currentType;
  });

  return result;
}


function compileMap(/* lists... */) {
  var result = {
        scalar: {},
        sequence: {},
        mapping: {},
        fallback: {},
        multi: {
          scalar: [],
          sequence: [],
          mapping: [],
          fallback: []
        }
      }, index, length;

  function collectType(type) {
    if (type.multi) {
      result.multi[type.kind].push(type);
      result.multi['fallback'].push(type);
    } else {
      result[type.kind][type.tag] = result['fallback'][type.tag] = type;
    }
  }

  for (index = 0, length = arguments.length; index < length; index += 1) {
    arguments[index].forEach(collectType);
  }
  return result;
}


function Schema$1(definition) {
  return this.extend(definition);
}


Schema$1.prototype.extend = function extend(definition) {
  var implicit = [];
  var explicit = [];

  if (definition instanceof type) {
    // Schema.extend(type)
    explicit.push(definition);

  } else if (Array.isArray(definition)) {
    // Schema.extend([ type1, type2, ... ])
    explicit = explicit.concat(definition);

  } else if (definition && (Array.isArray(definition.implicit) || Array.isArray(definition.explicit))) {
    // Schema.extend({ explicit: [ type1, type2, ... ], implicit: [ type1, type2, ... ] })
    if (definition.implicit) implicit = implicit.concat(definition.implicit);
    if (definition.explicit) explicit = explicit.concat(definition.explicit);

  } else {
    throw new exception('Schema.extend argument should be a Type, [ Type ], ' +
      'or a schema definition ({ implicit: [...], explicit: [...] })');
  }

  implicit.forEach(function (type$1) {
    if (!(type$1 instanceof type)) {
      throw new exception('Specified list of YAML types (or a single Type object) contains a non-Type object.');
    }

    if (type$1.loadKind && type$1.loadKind !== 'scalar') {
      throw new exception('There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.');
    }

    if (type$1.multi) {
      throw new exception('There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.');
    }
  });

  explicit.forEach(function (type$1) {
    if (!(type$1 instanceof type)) {
      throw new exception('Specified list of YAML types (or a single Type object) contains a non-Type object.');
    }
  });

  var result = Object.create(Schema$1.prototype);

  result.implicit = (this.implicit || []).concat(implicit);
  result.explicit = (this.explicit || []).concat(explicit);

  result.compiledImplicit = compileList(result, 'implicit');
  result.compiledExplicit = compileList(result, 'explicit');
  result.compiledTypeMap  = compileMap(result.compiledImplicit, result.compiledExplicit);

  return result;
};


var schema = Schema$1;

var str = new type('tag:yaml.org,2002:str', {
  kind: 'scalar',
  construct: function (data) { return data !== null ? data : ''; }
});

var seq = new type('tag:yaml.org,2002:seq', {
  kind: 'sequence',
  construct: function (data) { return data !== null ? data : []; }
});

var map = new type('tag:yaml.org,2002:map', {
  kind: 'mapping',
  construct: function (data) { return data !== null ? data : {}; }
});

var failsafe = new schema({
  explicit: [
    str,
    seq,
    map
  ]
});

function resolveYamlNull(data) {
  if (data === null) return true;

  var max = data.length;

  return (max === 1 && data === '~') ||
         (max === 4 && (data === 'null' || data === 'Null' || data === 'NULL'));
}

function constructYamlNull() {
  return null;
}

function isNull(object) {
  return object === null;
}

var _null = new type('tag:yaml.org,2002:null', {
  kind: 'scalar',
  resolve: resolveYamlNull,
  construct: constructYamlNull,
  predicate: isNull,
  represent: {
    canonical: function () { return '~';    },
    lowercase: function () { return 'null'; },
    uppercase: function () { return 'NULL'; },
    camelcase: function () { return 'Null'; },
    empty:     function () { return '';     }
  },
  defaultStyle: 'lowercase'
});

function resolveYamlBoolean(data) {
  if (data === null) return false;

  var max = data.length;

  return (max === 4 && (data === 'true' || data === 'True' || data === 'TRUE')) ||
         (max === 5 && (data === 'false' || data === 'False' || data === 'FALSE'));
}

function constructYamlBoolean(data) {
  return data === 'true' ||
         data === 'True' ||
         data === 'TRUE';
}

function isBoolean(object) {
  return Object.prototype.toString.call(object) === '[object Boolean]';
}

var bool = new type('tag:yaml.org,2002:bool', {
  kind: 'scalar',
  resolve: resolveYamlBoolean,
  construct: constructYamlBoolean,
  predicate: isBoolean,
  represent: {
    lowercase: function (object) { return object ? 'true' : 'false'; },
    uppercase: function (object) { return object ? 'TRUE' : 'FALSE'; },
    camelcase: function (object) { return object ? 'True' : 'False'; }
  },
  defaultStyle: 'lowercase'
});

function isHexCode(c) {
  return ((0x30/* 0 */ <= c) && (c <= 0x39/* 9 */)) ||
         ((0x41/* A */ <= c) && (c <= 0x46/* F */)) ||
         ((0x61/* a */ <= c) && (c <= 0x66/* f */));
}

function isOctCode(c) {
  return ((0x30/* 0 */ <= c) && (c <= 0x37/* 7 */));
}

function isDecCode(c) {
  return ((0x30/* 0 */ <= c) && (c <= 0x39/* 9 */));
}

function resolveYamlInteger(data) {
  if (data === null) return false;

  var max = data.length,
      index = 0,
      hasDigits = false,
      ch;

  if (!max) return false;

  ch = data[index];

  // sign
  if (ch === '-' || ch === '+') {
    ch = data[++index];
  }

  if (ch === '0') {
    // 0
    if (index + 1 === max) return true;
    ch = data[++index];

    // base 2, base 8, base 16

    if (ch === 'b') {
      // base 2
      index++;

      for (; index < max; index++) {
        ch = data[index];
        if (ch === '_') continue;
        if (ch !== '0' && ch !== '1') return false;
        hasDigits = true;
      }
      return hasDigits && ch !== '_';
    }


    if (ch === 'x') {
      // base 16
      index++;

      for (; index < max; index++) {
        ch = data[index];
        if (ch === '_') continue;
        if (!isHexCode(data.charCodeAt(index))) return false;
        hasDigits = true;
      }
      return hasDigits && ch !== '_';
    }


    if (ch === 'o') {
      // base 8
      index++;

      for (; index < max; index++) {
        ch = data[index];
        if (ch === '_') continue;
        if (!isOctCode(data.charCodeAt(index))) return false;
        hasDigits = true;
      }
      return hasDigits && ch !== '_';
    }
  }

  // base 10 (except 0)

  // value should not start with `_`;
  if (ch === '_') return false;

  for (; index < max; index++) {
    ch = data[index];
    if (ch === '_') continue;
    if (!isDecCode(data.charCodeAt(index))) {
      return false;
    }
    hasDigits = true;
  }

  // Should have digits and should not end with `_`
  if (!hasDigits || ch === '_') return false;

  return true;
}

function constructYamlInteger(data) {
  var value = data, sign = 1, ch;

  if (value.indexOf('_') !== -1) {
    value = value.replace(/_/g, '');
  }

  ch = value[0];

  if (ch === '-' || ch === '+') {
    if (ch === '-') sign = -1;
    value = value.slice(1);
    ch = value[0];
  }

  if (value === '0') return 0;

  if (ch === '0') {
    if (value[1] === 'b') return sign * parseInt(value.slice(2), 2);
    if (value[1] === 'x') return sign * parseInt(value.slice(2), 16);
    if (value[1] === 'o') return sign * parseInt(value.slice(2), 8);
  }

  return sign * parseInt(value, 10);
}

function isInteger(object) {
  return (Object.prototype.toString.call(object)) === '[object Number]' &&
         (object % 1 === 0 && !common.isNegativeZero(object));
}

var int = new type('tag:yaml.org,2002:int', {
  kind: 'scalar',
  resolve: resolveYamlInteger,
  construct: constructYamlInteger,
  predicate: isInteger,
  represent: {
    binary:      function (obj) { return obj >= 0 ? '0b' + obj.toString(2) : '-0b' + obj.toString(2).slice(1); },
    octal:       function (obj) { return obj >= 0 ? '0o'  + obj.toString(8) : '-0o'  + obj.toString(8).slice(1); },
    decimal:     function (obj) { return obj.toString(10); },
    /* eslint-disable max-len */
    hexadecimal: function (obj) { return obj >= 0 ? '0x' + obj.toString(16).toUpperCase() :  '-0x' + obj.toString(16).toUpperCase().slice(1); }
  },
  defaultStyle: 'decimal',
  styleAliases: {
    binary:      [ 2,  'bin' ],
    octal:       [ 8,  'oct' ],
    decimal:     [ 10, 'dec' ],
    hexadecimal: [ 16, 'hex' ]
  }
});

var YAML_FLOAT_PATTERN = new RegExp(
  // 2.5e4, 2.5 and integers
  '^(?:[-+]?(?:[0-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?' +
  // .2e4, .2
  // special case, seems not from spec
  '|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?' +
  // .inf
  '|[-+]?\\.(?:inf|Inf|INF)' +
  // .nan
  '|\\.(?:nan|NaN|NAN))$');

function resolveYamlFloat(data) {
  if (data === null) return false;

  if (!YAML_FLOAT_PATTERN.test(data) ||
      // Quick hack to not allow integers end with `_`
      // Probably should update regexp & check speed
      data[data.length - 1] === '_') {
    return false;
  }

  return true;
}

function constructYamlFloat(data) {
  var value, sign;

  value  = data.replace(/_/g, '').toLowerCase();
  sign   = value[0] === '-' ? -1 : 1;

  if ('+-'.indexOf(value[0]) >= 0) {
    value = value.slice(1);
  }

  if (value === '.inf') {
    return (sign === 1) ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;

  } else if (value === '.nan') {
    return NaN;
  }
  return sign * parseFloat(value, 10);
}


var SCIENTIFIC_WITHOUT_DOT = /^[-+]?[0-9]+e/;

function representYamlFloat(object, style) {
  var res;

  if (isNaN(object)) {
    switch (style) {
      case 'lowercase': return '.nan';
      case 'uppercase': return '.NAN';
      case 'camelcase': return '.NaN';
    }
  } else if (Number.POSITIVE_INFINITY === object) {
    switch (style) {
      case 'lowercase': return '.inf';
      case 'uppercase': return '.INF';
      case 'camelcase': return '.Inf';
    }
  } else if (Number.NEGATIVE_INFINITY === object) {
    switch (style) {
      case 'lowercase': return '-.inf';
      case 'uppercase': return '-.INF';
      case 'camelcase': return '-.Inf';
    }
  } else if (common.isNegativeZero(object)) {
    return '-0.0';
  }

  res = object.toString(10);

  // JS stringifier can build scientific format without dots: 5e-100,
  // while YAML requres dot: 5.e-100. Fix it with simple hack

  return SCIENTIFIC_WITHOUT_DOT.test(res) ? res.replace('e', '.e') : res;
}

function isFloat(object) {
  return (Object.prototype.toString.call(object) === '[object Number]') &&
         (object % 1 !== 0 || common.isNegativeZero(object));
}

var float = new type('tag:yaml.org,2002:float', {
  kind: 'scalar',
  resolve: resolveYamlFloat,
  construct: constructYamlFloat,
  predicate: isFloat,
  represent: representYamlFloat,
  defaultStyle: 'lowercase'
});

var json = failsafe.extend({
  implicit: [
    _null,
    bool,
    int,
    float
  ]
});

var core = json;

var YAML_DATE_REGEXP = new RegExp(
  '^([0-9][0-9][0-9][0-9])'          + // [1] year
  '-([0-9][0-9])'                    + // [2] month
  '-([0-9][0-9])$');                   // [3] day

var YAML_TIMESTAMP_REGEXP = new RegExp(
  '^([0-9][0-9][0-9][0-9])'          + // [1] year
  '-([0-9][0-9]?)'                   + // [2] month
  '-([0-9][0-9]?)'                   + // [3] day
  '(?:[Tt]|[ \\t]+)'                 + // ...
  '([0-9][0-9]?)'                    + // [4] hour
  ':([0-9][0-9])'                    + // [5] minute
  ':([0-9][0-9])'                    + // [6] second
  '(?:\\.([0-9]*))?'                 + // [7] fraction
  '(?:[ \\t]*(Z|([-+])([0-9][0-9]?)' + // [8] tz [9] tz_sign [10] tz_hour
  '(?::([0-9][0-9]))?))?$');           // [11] tz_minute

function resolveYamlTimestamp(data) {
  if (data === null) return false;
  if (YAML_DATE_REGEXP.exec(data) !== null) return true;
  if (YAML_TIMESTAMP_REGEXP.exec(data) !== null) return true;
  return false;
}

function constructYamlTimestamp(data) {
  var match, year, month, day, hour, minute, second, fraction = 0,
      delta = null, tz_hour, tz_minute, date;

  match = YAML_DATE_REGEXP.exec(data);
  if (match === null) match = YAML_TIMESTAMP_REGEXP.exec(data);

  if (match === null) throw new Error('Date resolve error');

  // match: [1] year [2] month [3] day

  year = +(match[1]);
  month = +(match[2]) - 1; // JS month starts with 0
  day = +(match[3]);

  if (!match[4]) { // no hour
    return new Date(Date.UTC(year, month, day));
  }

  // match: [4] hour [5] minute [6] second [7] fraction

  hour = +(match[4]);
  minute = +(match[5]);
  second = +(match[6]);

  if (match[7]) {
    fraction = match[7].slice(0, 3);
    while (fraction.length < 3) { // milli-seconds
      fraction += '0';
    }
    fraction = +fraction;
  }

  // match: [8] tz [9] tz_sign [10] tz_hour [11] tz_minute

  if (match[9]) {
    tz_hour = +(match[10]);
    tz_minute = +(match[11] || 0);
    delta = (tz_hour * 60 + tz_minute) * 60000; // delta in mili-seconds
    if (match[9] === '-') delta = -delta;
  }

  date = new Date(Date.UTC(year, month, day, hour, minute, second, fraction));

  if (delta) date.setTime(date.getTime() - delta);

  return date;
}

function representYamlTimestamp(object /*, style*/) {
  return object.toISOString();
}

var timestamp = new type('tag:yaml.org,2002:timestamp', {
  kind: 'scalar',
  resolve: resolveYamlTimestamp,
  construct: constructYamlTimestamp,
  instanceOf: Date,
  represent: representYamlTimestamp
});

function resolveYamlMerge(data) {
  return data === '<<' || data === null;
}

var merge = new type('tag:yaml.org,2002:merge', {
  kind: 'scalar',
  resolve: resolveYamlMerge
});

/*eslint-disable no-bitwise*/





// [ 64, 65, 66 ] -> [ padding, CR, LF ]
var BASE64_MAP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r';


function resolveYamlBinary(data) {
  if (data === null) return false;

  var code, idx, bitlen = 0, max = data.length, map = BASE64_MAP;

  // Convert one by one.
  for (idx = 0; idx < max; idx++) {
    code = map.indexOf(data.charAt(idx));

    // Skip CR/LF
    if (code > 64) continue;

    // Fail on illegal characters
    if (code < 0) return false;

    bitlen += 6;
  }

  // If there are any bits left, source was corrupted
  return (bitlen % 8) === 0;
}

function constructYamlBinary(data) {
  var idx, tailbits,
      input = data.replace(/[\r\n=]/g, ''), // remove CR/LF & padding to simplify scan
      max = input.length,
      map = BASE64_MAP,
      bits = 0,
      result = [];

  // Collect by 6*4 bits (3 bytes)

  for (idx = 0; idx < max; idx++) {
    if ((idx % 4 === 0) && idx) {
      result.push((bits >> 16) & 0xFF);
      result.push((bits >> 8) & 0xFF);
      result.push(bits & 0xFF);
    }

    bits = (bits << 6) | map.indexOf(input.charAt(idx));
  }

  // Dump tail

  tailbits = (max % 4) * 6;

  if (tailbits === 0) {
    result.push((bits >> 16) & 0xFF);
    result.push((bits >> 8) & 0xFF);
    result.push(bits & 0xFF);
  } else if (tailbits === 18) {
    result.push((bits >> 10) & 0xFF);
    result.push((bits >> 2) & 0xFF);
  } else if (tailbits === 12) {
    result.push((bits >> 4) & 0xFF);
  }

  return new Uint8Array(result);
}

function representYamlBinary(object /*, style*/) {
  var result = '', bits = 0, idx, tail,
      max = object.length,
      map = BASE64_MAP;

  // Convert every three bytes to 4 ASCII characters.

  for (idx = 0; idx < max; idx++) {
    if ((idx % 3 === 0) && idx) {
      result += map[(bits >> 18) & 0x3F];
      result += map[(bits >> 12) & 0x3F];
      result += map[(bits >> 6) & 0x3F];
      result += map[bits & 0x3F];
    }

    bits = (bits << 8) + object[idx];
  }

  // Dump tail

  tail = max % 3;

  if (tail === 0) {
    result += map[(bits >> 18) & 0x3F];
    result += map[(bits >> 12) & 0x3F];
    result += map[(bits >> 6) & 0x3F];
    result += map[bits & 0x3F];
  } else if (tail === 2) {
    result += map[(bits >> 10) & 0x3F];
    result += map[(bits >> 4) & 0x3F];
    result += map[(bits << 2) & 0x3F];
    result += map[64];
  } else if (tail === 1) {
    result += map[(bits >> 2) & 0x3F];
    result += map[(bits << 4) & 0x3F];
    result += map[64];
    result += map[64];
  }

  return result;
}

function isBinary(obj) {
  return Object.prototype.toString.call(obj) ===  '[object Uint8Array]';
}

var binary = new type('tag:yaml.org,2002:binary', {
  kind: 'scalar',
  resolve: resolveYamlBinary,
  construct: constructYamlBinary,
  predicate: isBinary,
  represent: representYamlBinary
});

var _hasOwnProperty$3 = Object.prototype.hasOwnProperty;
var _toString$2       = Object.prototype.toString;

function resolveYamlOmap(data) {
  if (data === null) return true;

  var objectKeys = [], index, length, pair, pairKey, pairHasKey,
      object = data;

  for (index = 0, length = object.length; index < length; index += 1) {
    pair = object[index];
    pairHasKey = false;

    if (_toString$2.call(pair) !== '[object Object]') return false;

    for (pairKey in pair) {
      if (_hasOwnProperty$3.call(pair, pairKey)) {
        if (!pairHasKey) pairHasKey = true;
        else return false;
      }
    }

    if (!pairHasKey) return false;

    if (objectKeys.indexOf(pairKey) === -1) objectKeys.push(pairKey);
    else return false;
  }

  return true;
}

function constructYamlOmap(data) {
  return data !== null ? data : [];
}

var omap = new type('tag:yaml.org,2002:omap', {
  kind: 'sequence',
  resolve: resolveYamlOmap,
  construct: constructYamlOmap
});

var _toString$1 = Object.prototype.toString;

function resolveYamlPairs(data) {
  if (data === null) return true;

  var index, length, pair, keys, result,
      object = data;

  result = new Array(object.length);

  for (index = 0, length = object.length; index < length; index += 1) {
    pair = object[index];

    if (_toString$1.call(pair) !== '[object Object]') return false;

    keys = Object.keys(pair);

    if (keys.length !== 1) return false;

    result[index] = [ keys[0], pair[keys[0]] ];
  }

  return true;
}

function constructYamlPairs(data) {
  if (data === null) return [];

  var index, length, pair, keys, result,
      object = data;

  result = new Array(object.length);

  for (index = 0, length = object.length; index < length; index += 1) {
    pair = object[index];

    keys = Object.keys(pair);

    result[index] = [ keys[0], pair[keys[0]] ];
  }

  return result;
}

var pairs = new type('tag:yaml.org,2002:pairs', {
  kind: 'sequence',
  resolve: resolveYamlPairs,
  construct: constructYamlPairs
});

var _hasOwnProperty$2 = Object.prototype.hasOwnProperty;

function resolveYamlSet(data) {
  if (data === null) return true;

  var key, object = data;

  for (key in object) {
    if (_hasOwnProperty$2.call(object, key)) {
      if (object[key] !== null) return false;
    }
  }

  return true;
}

function constructYamlSet(data) {
  return data !== null ? data : {};
}

var set = new type('tag:yaml.org,2002:set', {
  kind: 'mapping',
  resolve: resolveYamlSet,
  construct: constructYamlSet
});

var _default = core.extend({
  implicit: [
    timestamp,
    merge
  ],
  explicit: [
    binary,
    omap,
    pairs,
    set
  ]
});

/*eslint-disable max-len,no-use-before-define*/







var _hasOwnProperty$1 = Object.prototype.hasOwnProperty;


var CONTEXT_FLOW_IN   = 1;
var CONTEXT_FLOW_OUT  = 2;
var CONTEXT_BLOCK_IN  = 3;
var CONTEXT_BLOCK_OUT = 4;


var CHOMPING_CLIP  = 1;
var CHOMPING_STRIP = 2;
var CHOMPING_KEEP  = 3;


var PATTERN_NON_PRINTABLE         = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
var PATTERN_NON_ASCII_LINE_BREAKS = /[\x85\u2028\u2029]/;
var PATTERN_FLOW_INDICATORS       = /[,\[\]\{\}]/;
var PATTERN_TAG_HANDLE            = /^(?:!|!!|![a-z\-]+!)$/i;
var PATTERN_TAG_URI               = /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;


function _class(obj) { return Object.prototype.toString.call(obj); }

function is_EOL(c) {
  return (c === 0x0A/* LF */) || (c === 0x0D/* CR */);
}

function is_WHITE_SPACE(c) {
  return (c === 0x09/* Tab */) || (c === 0x20/* Space */);
}

function is_WS_OR_EOL(c) {
  return (c === 0x09/* Tab */) ||
         (c === 0x20/* Space */) ||
         (c === 0x0A/* LF */) ||
         (c === 0x0D/* CR */);
}

function is_FLOW_INDICATOR(c) {
  return c === 0x2C/* , */ ||
         c === 0x5B/* [ */ ||
         c === 0x5D/* ] */ ||
         c === 0x7B/* { */ ||
         c === 0x7D/* } */;
}

function fromHexCode(c) {
  var lc;

  if ((0x30/* 0 */ <= c) && (c <= 0x39/* 9 */)) {
    return c - 0x30;
  }

  /*eslint-disable no-bitwise*/
  lc = c | 0x20;

  if ((0x61/* a */ <= lc) && (lc <= 0x66/* f */)) {
    return lc - 0x61 + 10;
  }

  return -1;
}

function escapedHexLen(c) {
  if (c === 0x78/* x */) { return 2; }
  if (c === 0x75/* u */) { return 4; }
  if (c === 0x55/* U */) { return 8; }
  return 0;
}

function fromDecimalCode(c) {
  if ((0x30/* 0 */ <= c) && (c <= 0x39/* 9 */)) {
    return c - 0x30;
  }

  return -1;
}

function simpleEscapeSequence(c) {
  /* eslint-disable indent */
  return (c === 0x30/* 0 */) ? '\x00' :
        (c === 0x61/* a */) ? '\x07' :
        (c === 0x62/* b */) ? '\x08' :
        (c === 0x74/* t */) ? '\x09' :
        (c === 0x09/* Tab */) ? '\x09' :
        (c === 0x6E/* n */) ? '\x0A' :
        (c === 0x76/* v */) ? '\x0B' :
        (c === 0x66/* f */) ? '\x0C' :
        (c === 0x72/* r */) ? '\x0D' :
        (c === 0x65/* e */) ? '\x1B' :
        (c === 0x20/* Space */) ? ' ' :
        (c === 0x22/* " */) ? '\x22' :
        (c === 0x2F/* / */) ? '/' :
        (c === 0x5C/* \ */) ? '\x5C' :
        (c === 0x4E/* N */) ? '\x85' :
        (c === 0x5F/* _ */) ? '\xA0' :
        (c === 0x4C/* L */) ? '\u2028' :
        (c === 0x50/* P */) ? '\u2029' : '';
}

function charFromCodepoint(c) {
  if (c <= 0xFFFF) {
    return String.fromCharCode(c);
  }
  // Encode UTF-16 surrogate pair
  // https://en.wikipedia.org/wiki/UTF-16#Code_points_U.2B010000_to_U.2B10FFFF
  return String.fromCharCode(
    ((c - 0x010000) >> 10) + 0xD800,
    ((c - 0x010000) & 0x03FF) + 0xDC00
  );
}

var simpleEscapeCheck = new Array(256); // integer, for fast access
var simpleEscapeMap = new Array(256);
for (var i = 0; i < 256; i++) {
  simpleEscapeCheck[i] = simpleEscapeSequence(i) ? 1 : 0;
  simpleEscapeMap[i] = simpleEscapeSequence(i);
}


function State$1(input, options) {
  this.input = input;

  this.filename  = options['filename']  || null;
  this.schema    = options['schema']    || _default;
  this.onWarning = options['onWarning'] || null;
  // (Hidden) Remove? makes the loader to expect YAML 1.1 documents
  // if such documents have no explicit %YAML directive
  this.legacy    = options['legacy']    || false;

  this.json      = options['json']      || false;
  this.listener  = options['listener']  || null;

  this.implicitTypes = this.schema.compiledImplicit;
  this.typeMap       = this.schema.compiledTypeMap;

  this.length     = input.length;
  this.position   = 0;
  this.line       = 0;
  this.lineStart  = 0;
  this.lineIndent = 0;

  // position of first leading tab in the current line,
  // used to make sure there are no tabs in the indentation
  this.firstTabInLine = -1;

  this.documents = [];

  /*
  this.version;
  this.checkLineBreaks;
  this.tagMap;
  this.anchorMap;
  this.tag;
  this.anchor;
  this.kind;
  this.result;*/

}


function generateError(state, message) {
  var mark = {
    name:     state.filename,
    buffer:   state.input.slice(0, -1), // omit trailing \0
    position: state.position,
    line:     state.line,
    column:   state.position - state.lineStart
  };

  mark.snippet = snippet(mark);

  return new exception(message, mark);
}

function throwError(state, message) {
  throw generateError(state, message);
}

function throwWarning(state, message) {
  if (state.onWarning) {
    state.onWarning.call(null, generateError(state, message));
  }
}


var directiveHandlers = {

  YAML: function handleYamlDirective(state, name, args) {

    var match, major, minor;

    if (state.version !== null) {
      throwError(state, 'duplication of %YAML directive');
    }

    if (args.length !== 1) {
      throwError(state, 'YAML directive accepts exactly one argument');
    }

    match = /^([0-9]+)\.([0-9]+)$/.exec(args[0]);

    if (match === null) {
      throwError(state, 'ill-formed argument of the YAML directive');
    }

    major = parseInt(match[1], 10);
    minor = parseInt(match[2], 10);

    if (major !== 1) {
      throwError(state, 'unacceptable YAML version of the document');
    }

    state.version = args[0];
    state.checkLineBreaks = (minor < 2);

    if (minor !== 1 && minor !== 2) {
      throwWarning(state, 'unsupported YAML version of the document');
    }
  },

  TAG: function handleTagDirective(state, name, args) {

    var handle, prefix;

    if (args.length !== 2) {
      throwError(state, 'TAG directive accepts exactly two arguments');
    }

    handle = args[0];
    prefix = args[1];

    if (!PATTERN_TAG_HANDLE.test(handle)) {
      throwError(state, 'ill-formed tag handle (first argument) of the TAG directive');
    }

    if (_hasOwnProperty$1.call(state.tagMap, handle)) {
      throwError(state, 'there is a previously declared suffix for "' + handle + '" tag handle');
    }

    if (!PATTERN_TAG_URI.test(prefix)) {
      throwError(state, 'ill-formed tag prefix (second argument) of the TAG directive');
    }

    try {
      prefix = decodeURIComponent(prefix);
    } catch (err) {
      throwError(state, 'tag prefix is malformed: ' + prefix);
    }

    state.tagMap[handle] = prefix;
  }
};


function captureSegment(state, start, end, checkJson) {
  var _position, _length, _character, _result;

  if (start < end) {
    _result = state.input.slice(start, end);

    if (checkJson) {
      for (_position = 0, _length = _result.length; _position < _length; _position += 1) {
        _character = _result.charCodeAt(_position);
        if (!(_character === 0x09 ||
              (0x20 <= _character && _character <= 0x10FFFF))) {
          throwError(state, 'expected valid JSON character');
        }
      }
    } else if (PATTERN_NON_PRINTABLE.test(_result)) {
      throwError(state, 'the stream contains non-printable characters');
    }

    state.result += _result;
  }
}

function mergeMappings(state, destination, source, overridableKeys) {
  var sourceKeys, key, index, quantity;

  if (!common.isObject(source)) {
    throwError(state, 'cannot merge mappings; the provided source object is unacceptable');
  }

  sourceKeys = Object.keys(source);

  for (index = 0, quantity = sourceKeys.length; index < quantity; index += 1) {
    key = sourceKeys[index];

    if (!_hasOwnProperty$1.call(destination, key)) {
      destination[key] = source[key];
      overridableKeys[key] = true;
    }
  }
}

function storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode,
  startLine, startLineStart, startPos) {

  var index, quantity;

  // The output is a plain object here, so keys can only be strings.
  // We need to convert keyNode to a string, but doing so can hang the process
  // (deeply nested arrays that explode exponentially using aliases).
  if (Array.isArray(keyNode)) {
    keyNode = Array.prototype.slice.call(keyNode);

    for (index = 0, quantity = keyNode.length; index < quantity; index += 1) {
      if (Array.isArray(keyNode[index])) {
        throwError(state, 'nested arrays are not supported inside keys');
      }

      if (typeof keyNode === 'object' && _class(keyNode[index]) === '[object Object]') {
        keyNode[index] = '[object Object]';
      }
    }
  }

  // Avoid code execution in load() via toString property
  // (still use its own toString for arrays, timestamps,
  // and whatever user schema extensions happen to have @@toStringTag)
  if (typeof keyNode === 'object' && _class(keyNode) === '[object Object]') {
    keyNode = '[object Object]';
  }


  keyNode = String(keyNode);

  if (_result === null) {
    _result = {};
  }

  if (keyTag === 'tag:yaml.org,2002:merge') {
    if (Array.isArray(valueNode)) {
      for (index = 0, quantity = valueNode.length; index < quantity; index += 1) {
        mergeMappings(state, _result, valueNode[index], overridableKeys);
      }
    } else {
      mergeMappings(state, _result, valueNode, overridableKeys);
    }
  } else {
    if (!state.json &&
        !_hasOwnProperty$1.call(overridableKeys, keyNode) &&
        _hasOwnProperty$1.call(_result, keyNode)) {
      state.line = startLine || state.line;
      state.lineStart = startLineStart || state.lineStart;
      state.position = startPos || state.position;
      throwError(state, 'duplicated mapping key');
    }

    // used for this specific key only because Object.defineProperty is slow
    if (keyNode === '__proto__') {
      Object.defineProperty(_result, keyNode, {
        configurable: true,
        enumerable: true,
        writable: true,
        value: valueNode
      });
    } else {
      _result[keyNode] = valueNode;
    }
    delete overridableKeys[keyNode];
  }

  return _result;
}

function readLineBreak(state) {
  var ch;

  ch = state.input.charCodeAt(state.position);

  if (ch === 0x0A/* LF */) {
    state.position++;
  } else if (ch === 0x0D/* CR */) {
    state.position++;
    if (state.input.charCodeAt(state.position) === 0x0A/* LF */) {
      state.position++;
    }
  } else {
    throwError(state, 'a line break is expected');
  }

  state.line += 1;
  state.lineStart = state.position;
  state.firstTabInLine = -1;
}

function skipSeparationSpace(state, allowComments, checkIndent) {
  var lineBreaks = 0,
      ch = state.input.charCodeAt(state.position);

  while (ch !== 0) {
    while (is_WHITE_SPACE(ch)) {
      if (ch === 0x09/* Tab */ && state.firstTabInLine === -1) {
        state.firstTabInLine = state.position;
      }
      ch = state.input.charCodeAt(++state.position);
    }

    if (allowComments && ch === 0x23/* # */) {
      do {
        ch = state.input.charCodeAt(++state.position);
      } while (ch !== 0x0A/* LF */ && ch !== 0x0D/* CR */ && ch !== 0);
    }

    if (is_EOL(ch)) {
      readLineBreak(state);

      ch = state.input.charCodeAt(state.position);
      lineBreaks++;
      state.lineIndent = 0;

      while (ch === 0x20/* Space */) {
        state.lineIndent++;
        ch = state.input.charCodeAt(++state.position);
      }
    } else {
      break;
    }
  }

  if (checkIndent !== -1 && lineBreaks !== 0 && state.lineIndent < checkIndent) {
    throwWarning(state, 'deficient indentation');
  }

  return lineBreaks;
}

function testDocumentSeparator(state) {
  var _position = state.position,
      ch;

  ch = state.input.charCodeAt(_position);

  // Condition state.position === state.lineStart is tested
  // in parent on each call, for efficiency. No needs to test here again.
  if ((ch === 0x2D/* - */ || ch === 0x2E/* . */) &&
      ch === state.input.charCodeAt(_position + 1) &&
      ch === state.input.charCodeAt(_position + 2)) {

    _position += 3;

    ch = state.input.charCodeAt(_position);

    if (ch === 0 || is_WS_OR_EOL(ch)) {
      return true;
    }
  }

  return false;
}

function writeFoldedLines(state, count) {
  if (count === 1) {
    state.result += ' ';
  } else if (count > 1) {
    state.result += common.repeat('\n', count - 1);
  }
}


function readPlainScalar(state, nodeIndent, withinFlowCollection) {
  var preceding,
      following,
      captureStart,
      captureEnd,
      hasPendingContent,
      _line,
      _lineStart,
      _lineIndent,
      _kind = state.kind,
      _result = state.result,
      ch;

  ch = state.input.charCodeAt(state.position);

  if (is_WS_OR_EOL(ch)      ||
      is_FLOW_INDICATOR(ch) ||
      ch === 0x23/* # */    ||
      ch === 0x26/* & */    ||
      ch === 0x2A/* * */    ||
      ch === 0x21/* ! */    ||
      ch === 0x7C/* | */    ||
      ch === 0x3E/* > */    ||
      ch === 0x27/* ' */    ||
      ch === 0x22/* " */    ||
      ch === 0x25/* % */    ||
      ch === 0x40/* @ */    ||
      ch === 0x60/* ` */) {
    return false;
  }

  if (ch === 0x3F/* ? */ || ch === 0x2D/* - */) {
    following = state.input.charCodeAt(state.position + 1);

    if (is_WS_OR_EOL(following) ||
        withinFlowCollection && is_FLOW_INDICATOR(following)) {
      return false;
    }
  }

  state.kind = 'scalar';
  state.result = '';
  captureStart = captureEnd = state.position;
  hasPendingContent = false;

  while (ch !== 0) {
    if (ch === 0x3A/* : */) {
      following = state.input.charCodeAt(state.position + 1);

      if (is_WS_OR_EOL(following) ||
          withinFlowCollection && is_FLOW_INDICATOR(following)) {
        break;
      }

    } else if (ch === 0x23/* # */) {
      preceding = state.input.charCodeAt(state.position - 1);

      if (is_WS_OR_EOL(preceding)) {
        break;
      }

    } else if ((state.position === state.lineStart && testDocumentSeparator(state)) ||
               withinFlowCollection && is_FLOW_INDICATOR(ch)) {
      break;

    } else if (is_EOL(ch)) {
      _line = state.line;
      _lineStart = state.lineStart;
      _lineIndent = state.lineIndent;
      skipSeparationSpace(state, false, -1);

      if (state.lineIndent >= nodeIndent) {
        hasPendingContent = true;
        ch = state.input.charCodeAt(state.position);
        continue;
      } else {
        state.position = captureEnd;
        state.line = _line;
        state.lineStart = _lineStart;
        state.lineIndent = _lineIndent;
        break;
      }
    }

    if (hasPendingContent) {
      captureSegment(state, captureStart, captureEnd, false);
      writeFoldedLines(state, state.line - _line);
      captureStart = captureEnd = state.position;
      hasPendingContent = false;
    }

    if (!is_WHITE_SPACE(ch)) {
      captureEnd = state.position + 1;
    }

    ch = state.input.charCodeAt(++state.position);
  }

  captureSegment(state, captureStart, captureEnd, false);

  if (state.result) {
    return true;
  }

  state.kind = _kind;
  state.result = _result;
  return false;
}

function readSingleQuotedScalar(state, nodeIndent) {
  var ch,
      captureStart, captureEnd;

  ch = state.input.charCodeAt(state.position);

  if (ch !== 0x27/* ' */) {
    return false;
  }

  state.kind = 'scalar';
  state.result = '';
  state.position++;
  captureStart = captureEnd = state.position;

  while ((ch = state.input.charCodeAt(state.position)) !== 0) {
    if (ch === 0x27/* ' */) {
      captureSegment(state, captureStart, state.position, true);
      ch = state.input.charCodeAt(++state.position);

      if (ch === 0x27/* ' */) {
        captureStart = state.position;
        state.position++;
        captureEnd = state.position;
      } else {
        return true;
      }

    } else if (is_EOL(ch)) {
      captureSegment(state, captureStart, captureEnd, true);
      writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
      captureStart = captureEnd = state.position;

    } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
      throwError(state, 'unexpected end of the document within a single quoted scalar');

    } else {
      state.position++;
      captureEnd = state.position;
    }
  }

  throwError(state, 'unexpected end of the stream within a single quoted scalar');
}

function readDoubleQuotedScalar(state, nodeIndent) {
  var captureStart,
      captureEnd,
      hexLength,
      hexResult,
      tmp,
      ch;

  ch = state.input.charCodeAt(state.position);

  if (ch !== 0x22/* " */) {
    return false;
  }

  state.kind = 'scalar';
  state.result = '';
  state.position++;
  captureStart = captureEnd = state.position;

  while ((ch = state.input.charCodeAt(state.position)) !== 0) {
    if (ch === 0x22/* " */) {
      captureSegment(state, captureStart, state.position, true);
      state.position++;
      return true;

    } else if (ch === 0x5C/* \ */) {
      captureSegment(state, captureStart, state.position, true);
      ch = state.input.charCodeAt(++state.position);

      if (is_EOL(ch)) {
        skipSeparationSpace(state, false, nodeIndent);

        // TODO: rework to inline fn with no type cast?
      } else if (ch < 256 && simpleEscapeCheck[ch]) {
        state.result += simpleEscapeMap[ch];
        state.position++;

      } else if ((tmp = escapedHexLen(ch)) > 0) {
        hexLength = tmp;
        hexResult = 0;

        for (; hexLength > 0; hexLength--) {
          ch = state.input.charCodeAt(++state.position);

          if ((tmp = fromHexCode(ch)) >= 0) {
            hexResult = (hexResult << 4) + tmp;

          } else {
            throwError(state, 'expected hexadecimal character');
          }
        }

        state.result += charFromCodepoint(hexResult);

        state.position++;

      } else {
        throwError(state, 'unknown escape sequence');
      }

      captureStart = captureEnd = state.position;

    } else if (is_EOL(ch)) {
      captureSegment(state, captureStart, captureEnd, true);
      writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
      captureStart = captureEnd = state.position;

    } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
      throwError(state, 'unexpected end of the document within a double quoted scalar');

    } else {
      state.position++;
      captureEnd = state.position;
    }
  }

  throwError(state, 'unexpected end of the stream within a double quoted scalar');
}

function readFlowCollection(state, nodeIndent) {
  var readNext = true,
      _line,
      _lineStart,
      _pos,
      _tag     = state.tag,
      _result,
      _anchor  = state.anchor,
      following,
      terminator,
      isPair,
      isExplicitPair,
      isMapping,
      overridableKeys = Object.create(null),
      keyNode,
      keyTag,
      valueNode,
      ch;

  ch = state.input.charCodeAt(state.position);

  if (ch === 0x5B/* [ */) {
    terminator = 0x5D;/* ] */
    isMapping = false;
    _result = [];
  } else if (ch === 0x7B/* { */) {
    terminator = 0x7D;/* } */
    isMapping = true;
    _result = {};
  } else {
    return false;
  }

  if (state.anchor !== null) {
    state.anchorMap[state.anchor] = _result;
  }

  ch = state.input.charCodeAt(++state.position);

  while (ch !== 0) {
    skipSeparationSpace(state, true, nodeIndent);

    ch = state.input.charCodeAt(state.position);

    if (ch === terminator) {
      state.position++;
      state.tag = _tag;
      state.anchor = _anchor;
      state.kind = isMapping ? 'mapping' : 'sequence';
      state.result = _result;
      return true;
    } else if (!readNext) {
      throwError(state, 'missed comma between flow collection entries');
    } else if (ch === 0x2C/* , */) {
      // "flow collection entries can never be completely empty", as per YAML 1.2, section 7.4
      throwError(state, "expected the node content, but found ','");
    }

    keyTag = keyNode = valueNode = null;
    isPair = isExplicitPair = false;

    if (ch === 0x3F/* ? */) {
      following = state.input.charCodeAt(state.position + 1);

      if (is_WS_OR_EOL(following)) {
        isPair = isExplicitPair = true;
        state.position++;
        skipSeparationSpace(state, true, nodeIndent);
      }
    }

    _line = state.line; // Save the current line.
    _lineStart = state.lineStart;
    _pos = state.position;
    composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
    keyTag = state.tag;
    keyNode = state.result;
    skipSeparationSpace(state, true, nodeIndent);

    ch = state.input.charCodeAt(state.position);

    if ((isExplicitPair || state.line === _line) && ch === 0x3A/* : */) {
      isPair = true;
      ch = state.input.charCodeAt(++state.position);
      skipSeparationSpace(state, true, nodeIndent);
      composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
      valueNode = state.result;
    }

    if (isMapping) {
      storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos);
    } else if (isPair) {
      _result.push(storeMappingPair(state, null, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos));
    } else {
      _result.push(keyNode);
    }

    skipSeparationSpace(state, true, nodeIndent);

    ch = state.input.charCodeAt(state.position);

    if (ch === 0x2C/* , */) {
      readNext = true;
      ch = state.input.charCodeAt(++state.position);
    } else {
      readNext = false;
    }
  }

  throwError(state, 'unexpected end of the stream within a flow collection');
}

function readBlockScalar(state, nodeIndent) {
  var captureStart,
      folding,
      chomping       = CHOMPING_CLIP,
      didReadContent = false,
      detectedIndent = false,
      textIndent     = nodeIndent,
      emptyLines     = 0,
      atMoreIndented = false,
      tmp,
      ch;

  ch = state.input.charCodeAt(state.position);

  if (ch === 0x7C/* | */) {
    folding = false;
  } else if (ch === 0x3E/* > */) {
    folding = true;
  } else {
    return false;
  }

  state.kind = 'scalar';
  state.result = '';

  while (ch !== 0) {
    ch = state.input.charCodeAt(++state.position);

    if (ch === 0x2B/* + */ || ch === 0x2D/* - */) {
      if (CHOMPING_CLIP === chomping) {
        chomping = (ch === 0x2B/* + */) ? CHOMPING_KEEP : CHOMPING_STRIP;
      } else {
        throwError(state, 'repeat of a chomping mode identifier');
      }

    } else if ((tmp = fromDecimalCode(ch)) >= 0) {
      if (tmp === 0) {
        throwError(state, 'bad explicit indentation width of a block scalar; it cannot be less than one');
      } else if (!detectedIndent) {
        textIndent = nodeIndent + tmp - 1;
        detectedIndent = true;
      } else {
        throwError(state, 'repeat of an indentation width identifier');
      }

    } else {
      break;
    }
  }

  if (is_WHITE_SPACE(ch)) {
    do { ch = state.input.charCodeAt(++state.position); }
    while (is_WHITE_SPACE(ch));

    if (ch === 0x23/* # */) {
      do { ch = state.input.charCodeAt(++state.position); }
      while (!is_EOL(ch) && (ch !== 0));
    }
  }

  while (ch !== 0) {
    readLineBreak(state);
    state.lineIndent = 0;

    ch = state.input.charCodeAt(state.position);

    while ((!detectedIndent || state.lineIndent < textIndent) &&
           (ch === 0x20/* Space */)) {
      state.lineIndent++;
      ch = state.input.charCodeAt(++state.position);
    }

    if (!detectedIndent && state.lineIndent > textIndent) {
      textIndent = state.lineIndent;
    }

    if (is_EOL(ch)) {
      emptyLines++;
      continue;
    }

    // End of the scalar.
    if (state.lineIndent < textIndent) {

      // Perform the chomping.
      if (chomping === CHOMPING_KEEP) {
        state.result += common.repeat('\n', didReadContent ? 1 + emptyLines : emptyLines);
      } else if (chomping === CHOMPING_CLIP) {
        if (didReadContent) { // i.e. only if the scalar is not empty.
          state.result += '\n';
        }
      }

      // Break this `while` cycle and go to the funciton's epilogue.
      break;
    }

    // Folded style: use fancy rules to handle line breaks.
    if (folding) {

      // Lines starting with white space characters (more-indented lines) are not folded.
      if (is_WHITE_SPACE(ch)) {
        atMoreIndented = true;
        // except for the first content line (cf. Example 8.1)
        state.result += common.repeat('\n', didReadContent ? 1 + emptyLines : emptyLines);

      // End of more-indented block.
      } else if (atMoreIndented) {
        atMoreIndented = false;
        state.result += common.repeat('\n', emptyLines + 1);

      // Just one line break - perceive as the same line.
      } else if (emptyLines === 0) {
        if (didReadContent) { // i.e. only if we have already read some scalar content.
          state.result += ' ';
        }

      // Several line breaks - perceive as different lines.
      } else {
        state.result += common.repeat('\n', emptyLines);
      }

    // Literal style: just add exact number of line breaks between content lines.
    } else {
      // Keep all line breaks except the header line break.
      state.result += common.repeat('\n', didReadContent ? 1 + emptyLines : emptyLines);
    }

    didReadContent = true;
    detectedIndent = true;
    emptyLines = 0;
    captureStart = state.position;

    while (!is_EOL(ch) && (ch !== 0)) {
      ch = state.input.charCodeAt(++state.position);
    }

    captureSegment(state, captureStart, state.position, false);
  }

  return true;
}

function readBlockSequence(state, nodeIndent) {
  var _line,
      _tag      = state.tag,
      _anchor   = state.anchor,
      _result   = [],
      following,
      detected  = false,
      ch;

  // there is a leading tab before this token, so it can't be a block sequence/mapping;
  // it can still be flow sequence/mapping or a scalar
  if (state.firstTabInLine !== -1) return false;

  if (state.anchor !== null) {
    state.anchorMap[state.anchor] = _result;
  }

  ch = state.input.charCodeAt(state.position);

  while (ch !== 0) {
    if (state.firstTabInLine !== -1) {
      state.position = state.firstTabInLine;
      throwError(state, 'tab characters must not be used in indentation');
    }

    if (ch !== 0x2D/* - */) {
      break;
    }

    following = state.input.charCodeAt(state.position + 1);

    if (!is_WS_OR_EOL(following)) {
      break;
    }

    detected = true;
    state.position++;

    if (skipSeparationSpace(state, true, -1)) {
      if (state.lineIndent <= nodeIndent) {
        _result.push(null);
        ch = state.input.charCodeAt(state.position);
        continue;
      }
    }

    _line = state.line;
    composeNode(state, nodeIndent, CONTEXT_BLOCK_IN, false, true);
    _result.push(state.result);
    skipSeparationSpace(state, true, -1);

    ch = state.input.charCodeAt(state.position);

    if ((state.line === _line || state.lineIndent > nodeIndent) && (ch !== 0)) {
      throwError(state, 'bad indentation of a sequence entry');
    } else if (state.lineIndent < nodeIndent) {
      break;
    }
  }

  if (detected) {
    state.tag = _tag;
    state.anchor = _anchor;
    state.kind = 'sequence';
    state.result = _result;
    return true;
  }
  return false;
}

function readBlockMapping(state, nodeIndent, flowIndent) {
  var following,
      allowCompact,
      _line,
      _keyLine,
      _keyLineStart,
      _keyPos,
      _tag          = state.tag,
      _anchor       = state.anchor,
      _result       = {},
      overridableKeys = Object.create(null),
      keyTag        = null,
      keyNode       = null,
      valueNode     = null,
      atExplicitKey = false,
      detected      = false,
      ch;

  // there is a leading tab before this token, so it can't be a block sequence/mapping;
  // it can still be flow sequence/mapping or a scalar
  if (state.firstTabInLine !== -1) return false;

  if (state.anchor !== null) {
    state.anchorMap[state.anchor] = _result;
  }

  ch = state.input.charCodeAt(state.position);

  while (ch !== 0) {
    if (!atExplicitKey && state.firstTabInLine !== -1) {
      state.position = state.firstTabInLine;
      throwError(state, 'tab characters must not be used in indentation');
    }

    following = state.input.charCodeAt(state.position + 1);
    _line = state.line; // Save the current line.

    //
    // Explicit notation case. There are two separate blocks:
    // first for the key (denoted by "?") and second for the value (denoted by ":")
    //
    if ((ch === 0x3F/* ? */ || ch === 0x3A/* : */) && is_WS_OR_EOL(following)) {

      if (ch === 0x3F/* ? */) {
        if (atExplicitKey) {
          storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
          keyTag = keyNode = valueNode = null;
        }

        detected = true;
        atExplicitKey = true;
        allowCompact = true;

      } else if (atExplicitKey) {
        // i.e. 0x3A/* : */ === character after the explicit key.
        atExplicitKey = false;
        allowCompact = true;

      } else {
        throwError(state, 'incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line');
      }

      state.position += 1;
      ch = following;

    //
    // Implicit notation case. Flow-style node as the key first, then ":", and the value.
    //
    } else {
      _keyLine = state.line;
      _keyLineStart = state.lineStart;
      _keyPos = state.position;

      if (!composeNode(state, flowIndent, CONTEXT_FLOW_OUT, false, true)) {
        // Neither implicit nor explicit notation.
        // Reading is done. Go to the epilogue.
        break;
      }

      if (state.line === _line) {
        ch = state.input.charCodeAt(state.position);

        while (is_WHITE_SPACE(ch)) {
          ch = state.input.charCodeAt(++state.position);
        }

        if (ch === 0x3A/* : */) {
          ch = state.input.charCodeAt(++state.position);

          if (!is_WS_OR_EOL(ch)) {
            throwError(state, 'a whitespace character is expected after the key-value separator within a block mapping');
          }

          if (atExplicitKey) {
            storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
            keyTag = keyNode = valueNode = null;
          }

          detected = true;
          atExplicitKey = false;
          allowCompact = false;
          keyTag = state.tag;
          keyNode = state.result;

        } else if (detected) {
          throwError(state, 'can not read an implicit mapping pair; a colon is missed');

        } else {
          state.tag = _tag;
          state.anchor = _anchor;
          return true; // Keep the result of `composeNode`.
        }

      } else if (detected) {
        throwError(state, 'can not read a block mapping entry; a multiline key may not be an implicit key');

      } else {
        state.tag = _tag;
        state.anchor = _anchor;
        return true; // Keep the result of `composeNode`.
      }
    }

    //
    // Common reading code for both explicit and implicit notations.
    //
    if (state.line === _line || state.lineIndent > nodeIndent) {
      if (atExplicitKey) {
        _keyLine = state.line;
        _keyLineStart = state.lineStart;
        _keyPos = state.position;
      }

      if (composeNode(state, nodeIndent, CONTEXT_BLOCK_OUT, true, allowCompact)) {
        if (atExplicitKey) {
          keyNode = state.result;
        } else {
          valueNode = state.result;
        }
      }

      if (!atExplicitKey) {
        storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _keyLine, _keyLineStart, _keyPos);
        keyTag = keyNode = valueNode = null;
      }

      skipSeparationSpace(state, true, -1);
      ch = state.input.charCodeAt(state.position);
    }

    if ((state.line === _line || state.lineIndent > nodeIndent) && (ch !== 0)) {
      throwError(state, 'bad indentation of a mapping entry');
    } else if (state.lineIndent < nodeIndent) {
      break;
    }
  }

  //
  // Epilogue.
  //

  // Special case: last mapping's node contains only the key in explicit notation.
  if (atExplicitKey) {
    storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
  }

  // Expose the resulting mapping.
  if (detected) {
    state.tag = _tag;
    state.anchor = _anchor;
    state.kind = 'mapping';
    state.result = _result;
  }

  return detected;
}

function readTagProperty(state) {
  var _position,
      isVerbatim = false,
      isNamed    = false,
      tagHandle,
      tagName,
      ch;

  ch = state.input.charCodeAt(state.position);

  if (ch !== 0x21/* ! */) return false;

  if (state.tag !== null) {
    throwError(state, 'duplication of a tag property');
  }

  ch = state.input.charCodeAt(++state.position);

  if (ch === 0x3C/* < */) {
    isVerbatim = true;
    ch = state.input.charCodeAt(++state.position);

  } else if (ch === 0x21/* ! */) {
    isNamed = true;
    tagHandle = '!!';
    ch = state.input.charCodeAt(++state.position);

  } else {
    tagHandle = '!';
  }

  _position = state.position;

  if (isVerbatim) {
    do { ch = state.input.charCodeAt(++state.position); }
    while (ch !== 0 && ch !== 0x3E/* > */);

    if (state.position < state.length) {
      tagName = state.input.slice(_position, state.position);
      ch = state.input.charCodeAt(++state.position);
    } else {
      throwError(state, 'unexpected end of the stream within a verbatim tag');
    }
  } else {
    while (ch !== 0 && !is_WS_OR_EOL(ch)) {

      if (ch === 0x21/* ! */) {
        if (!isNamed) {
          tagHandle = state.input.slice(_position - 1, state.position + 1);

          if (!PATTERN_TAG_HANDLE.test(tagHandle)) {
            throwError(state, 'named tag handle cannot contain such characters');
          }

          isNamed = true;
          _position = state.position + 1;
        } else {
          throwError(state, 'tag suffix cannot contain exclamation marks');
        }
      }

      ch = state.input.charCodeAt(++state.position);
    }

    tagName = state.input.slice(_position, state.position);

    if (PATTERN_FLOW_INDICATORS.test(tagName)) {
      throwError(state, 'tag suffix cannot contain flow indicator characters');
    }
  }

  if (tagName && !PATTERN_TAG_URI.test(tagName)) {
    throwError(state, 'tag name cannot contain such characters: ' + tagName);
  }

  try {
    tagName = decodeURIComponent(tagName);
  } catch (err) {
    throwError(state, 'tag name is malformed: ' + tagName);
  }

  if (isVerbatim) {
    state.tag = tagName;

  } else if (_hasOwnProperty$1.call(state.tagMap, tagHandle)) {
    state.tag = state.tagMap[tagHandle] + tagName;

  } else if (tagHandle === '!') {
    state.tag = '!' + tagName;

  } else if (tagHandle === '!!') {
    state.tag = 'tag:yaml.org,2002:' + tagName;

  } else {
    throwError(state, 'undeclared tag handle "' + tagHandle + '"');
  }

  return true;
}

function readAnchorProperty(state) {
  var _position,
      ch;

  ch = state.input.charCodeAt(state.position);

  if (ch !== 0x26/* & */) return false;

  if (state.anchor !== null) {
    throwError(state, 'duplication of an anchor property');
  }

  ch = state.input.charCodeAt(++state.position);
  _position = state.position;

  while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) {
    ch = state.input.charCodeAt(++state.position);
  }

  if (state.position === _position) {
    throwError(state, 'name of an anchor node must contain at least one character');
  }

  state.anchor = state.input.slice(_position, state.position);
  return true;
}

function readAlias(state) {
  var _position, alias,
      ch;

  ch = state.input.charCodeAt(state.position);

  if (ch !== 0x2A/* * */) return false;

  ch = state.input.charCodeAt(++state.position);
  _position = state.position;

  while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) {
    ch = state.input.charCodeAt(++state.position);
  }

  if (state.position === _position) {
    throwError(state, 'name of an alias node must contain at least one character');
  }

  alias = state.input.slice(_position, state.position);

  if (!_hasOwnProperty$1.call(state.anchorMap, alias)) {
    throwError(state, 'unidentified alias "' + alias + '"');
  }

  state.result = state.anchorMap[alias];
  skipSeparationSpace(state, true, -1);
  return true;
}

function composeNode(state, parentIndent, nodeContext, allowToSeek, allowCompact) {
  var allowBlockStyles,
      allowBlockScalars,
      allowBlockCollections,
      indentStatus = 1, // 1: this>parent, 0: this=parent, -1: this<parent
      atNewLine  = false,
      hasContent = false,
      typeIndex,
      typeQuantity,
      typeList,
      type,
      flowIndent,
      blockIndent;

  if (state.listener !== null) {
    state.listener('open', state);
  }

  state.tag    = null;
  state.anchor = null;
  state.kind   = null;
  state.result = null;

  allowBlockStyles = allowBlockScalars = allowBlockCollections =
    CONTEXT_BLOCK_OUT === nodeContext ||
    CONTEXT_BLOCK_IN  === nodeContext;

  if (allowToSeek) {
    if (skipSeparationSpace(state, true, -1)) {
      atNewLine = true;

      if (state.lineIndent > parentIndent) {
        indentStatus = 1;
      } else if (state.lineIndent === parentIndent) {
        indentStatus = 0;
      } else if (state.lineIndent < parentIndent) {
        indentStatus = -1;
      }
    }
  }

  if (indentStatus === 1) {
    while (readTagProperty(state) || readAnchorProperty(state)) {
      if (skipSeparationSpace(state, true, -1)) {
        atNewLine = true;
        allowBlockCollections = allowBlockStyles;

        if (state.lineIndent > parentIndent) {
          indentStatus = 1;
        } else if (state.lineIndent === parentIndent) {
          indentStatus = 0;
        } else if (state.lineIndent < parentIndent) {
          indentStatus = -1;
        }
      } else {
        allowBlockCollections = false;
      }
    }
  }

  if (allowBlockCollections) {
    allowBlockCollections = atNewLine || allowCompact;
  }

  if (indentStatus === 1 || CONTEXT_BLOCK_OUT === nodeContext) {
    if (CONTEXT_FLOW_IN === nodeContext || CONTEXT_FLOW_OUT === nodeContext) {
      flowIndent = parentIndent;
    } else {
      flowIndent = parentIndent + 1;
    }

    blockIndent = state.position - state.lineStart;

    if (indentStatus === 1) {
      if (allowBlockCollections &&
          (readBlockSequence(state, blockIndent) ||
           readBlockMapping(state, blockIndent, flowIndent)) ||
          readFlowCollection(state, flowIndent)) {
        hasContent = true;
      } else {
        if ((allowBlockScalars && readBlockScalar(state, flowIndent)) ||
            readSingleQuotedScalar(state, flowIndent) ||
            readDoubleQuotedScalar(state, flowIndent)) {
          hasContent = true;

        } else if (readAlias(state)) {
          hasContent = true;

          if (state.tag !== null || state.anchor !== null) {
            throwError(state, 'alias node should not have any properties');
          }

        } else if (readPlainScalar(state, flowIndent, CONTEXT_FLOW_IN === nodeContext)) {
          hasContent = true;

          if (state.tag === null) {
            state.tag = '?';
          }
        }

        if (state.anchor !== null) {
          state.anchorMap[state.anchor] = state.result;
        }
      }
    } else if (indentStatus === 0) {
      // Special case: block sequences are allowed to have same indentation level as the parent.
      // http://www.yaml.org/spec/1.2/spec.html#id2799784
      hasContent = allowBlockCollections && readBlockSequence(state, blockIndent);
    }
  }

  if (state.tag === null) {
    if (state.anchor !== null) {
      state.anchorMap[state.anchor] = state.result;
    }

  } else if (state.tag === '?') {
    // Implicit resolving is not allowed for non-scalar types, and '?'
    // non-specific tag is only automatically assigned to plain scalars.
    //
    // We only need to check kind conformity in case user explicitly assigns '?'
    // tag, for example like this: "!<?> [0]"
    //
    if (state.result !== null && state.kind !== 'scalar') {
      throwError(state, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + state.kind + '"');
    }

    for (typeIndex = 0, typeQuantity = state.implicitTypes.length; typeIndex < typeQuantity; typeIndex += 1) {
      type = state.implicitTypes[typeIndex];

      if (type.resolve(state.result)) { // `state.result` updated in resolver if matched
        state.result = type.construct(state.result);
        state.tag = type.tag;
        if (state.anchor !== null) {
          state.anchorMap[state.anchor] = state.result;
        }
        break;
      }
    }
  } else if (state.tag !== '!') {
    if (_hasOwnProperty$1.call(state.typeMap[state.kind || 'fallback'], state.tag)) {
      type = state.typeMap[state.kind || 'fallback'][state.tag];
    } else {
      // looking for multi type
      type = null;
      typeList = state.typeMap.multi[state.kind || 'fallback'];

      for (typeIndex = 0, typeQuantity = typeList.length; typeIndex < typeQuantity; typeIndex += 1) {
        if (state.tag.slice(0, typeList[typeIndex].tag.length) === typeList[typeIndex].tag) {
          type = typeList[typeIndex];
          break;
        }
      }
    }

    if (!type) {
      throwError(state, 'unknown tag !<' + state.tag + '>');
    }

    if (state.result !== null && type.kind !== state.kind) {
      throwError(state, 'unacceptable node kind for !<' + state.tag + '> tag; it should be "' + type.kind + '", not "' + state.kind + '"');
    }

    if (!type.resolve(state.result, state.tag)) { // `state.result` updated in resolver if matched
      throwError(state, 'cannot resolve a node with !<' + state.tag + '> explicit tag');
    } else {
      state.result = type.construct(state.result, state.tag);
      if (state.anchor !== null) {
        state.anchorMap[state.anchor] = state.result;
      }
    }
  }

  if (state.listener !== null) {
    state.listener('close', state);
  }
  return state.tag !== null ||  state.anchor !== null || hasContent;
}

function readDocument(state) {
  var documentStart = state.position,
      _position,
      directiveName,
      directiveArgs,
      hasDirectives = false,
      ch;

  state.version = null;
  state.checkLineBreaks = state.legacy;
  state.tagMap = Object.create(null);
  state.anchorMap = Object.create(null);

  while ((ch = state.input.charCodeAt(state.position)) !== 0) {
    skipSeparationSpace(state, true, -1);

    ch = state.input.charCodeAt(state.position);

    if (state.lineIndent > 0 || ch !== 0x25/* % */) {
      break;
    }

    hasDirectives = true;
    ch = state.input.charCodeAt(++state.position);
    _position = state.position;

    while (ch !== 0 && !is_WS_OR_EOL(ch)) {
      ch = state.input.charCodeAt(++state.position);
    }

    directiveName = state.input.slice(_position, state.position);
    directiveArgs = [];

    if (directiveName.length < 1) {
      throwError(state, 'directive name must not be less than one character in length');
    }

    while (ch !== 0) {
      while (is_WHITE_SPACE(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }

      if (ch === 0x23/* # */) {
        do { ch = state.input.charCodeAt(++state.position); }
        while (ch !== 0 && !is_EOL(ch));
        break;
      }

      if (is_EOL(ch)) break;

      _position = state.position;

      while (ch !== 0 && !is_WS_OR_EOL(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }

      directiveArgs.push(state.input.slice(_position, state.position));
    }

    if (ch !== 0) readLineBreak(state);

    if (_hasOwnProperty$1.call(directiveHandlers, directiveName)) {
      directiveHandlers[directiveName](state, directiveName, directiveArgs);
    } else {
      throwWarning(state, 'unknown document directive "' + directiveName + '"');
    }
  }

  skipSeparationSpace(state, true, -1);

  if (state.lineIndent === 0 &&
      state.input.charCodeAt(state.position)     === 0x2D/* - */ &&
      state.input.charCodeAt(state.position + 1) === 0x2D/* - */ &&
      state.input.charCodeAt(state.position + 2) === 0x2D/* - */) {
    state.position += 3;
    skipSeparationSpace(state, true, -1);

  } else if (hasDirectives) {
    throwError(state, 'directives end mark is expected');
  }

  composeNode(state, state.lineIndent - 1, CONTEXT_BLOCK_OUT, false, true);
  skipSeparationSpace(state, true, -1);

  if (state.checkLineBreaks &&
      PATTERN_NON_ASCII_LINE_BREAKS.test(state.input.slice(documentStart, state.position))) {
    throwWarning(state, 'non-ASCII line breaks are interpreted as content');
  }

  state.documents.push(state.result);

  if (state.position === state.lineStart && testDocumentSeparator(state)) {

    if (state.input.charCodeAt(state.position) === 0x2E/* . */) {
      state.position += 3;
      skipSeparationSpace(state, true, -1);
    }
    return;
  }

  if (state.position < (state.length - 1)) {
    throwError(state, 'end of the stream or a document separator is expected');
  } else {
    return;
  }
}


function loadDocuments(input, options) {
  input = String(input);
  options = options || {};

  if (input.length !== 0) {

    // Add tailing `\n` if not exists
    if (input.charCodeAt(input.length - 1) !== 0x0A/* LF */ &&
        input.charCodeAt(input.length - 1) !== 0x0D/* CR */) {
      input += '\n';
    }

    // Strip BOM
    if (input.charCodeAt(0) === 0xFEFF) {
      input = input.slice(1);
    }
  }

  var state = new State$1(input, options);

  var nullpos = input.indexOf('\0');

  if (nullpos !== -1) {
    state.position = nullpos;
    throwError(state, 'null byte is not allowed in input');
  }

  // Use 0 as string terminator. That significantly simplifies bounds check.
  state.input += '\0';

  while (state.input.charCodeAt(state.position) === 0x20/* Space */) {
    state.lineIndent += 1;
    state.position += 1;
  }

  while (state.position < (state.length - 1)) {
    readDocument(state);
  }

  return state.documents;
}


function loadAll$1(input, iterator, options) {
  if (iterator !== null && typeof iterator === 'object' && typeof options === 'undefined') {
    options = iterator;
    iterator = null;
  }

  var documents = loadDocuments(input, options);

  if (typeof iterator !== 'function') {
    return documents;
  }

  for (var index = 0, length = documents.length; index < length; index += 1) {
    iterator(documents[index]);
  }
}


function load$1(input, options) {
  var documents = loadDocuments(input, options);

  if (documents.length === 0) {
    /*eslint-disable no-undefined*/
    return undefined;
  } else if (documents.length === 1) {
    return documents[0];
  }
  throw new exception('expected a single document in the stream, but found more');
}


var loadAll_1 = loadAll$1;
var load_1    = load$1;

var loader = {
	loadAll: loadAll_1,
	load: load_1
};

/*eslint-disable no-use-before-define*/





var _toString       = Object.prototype.toString;
var _hasOwnProperty = Object.prototype.hasOwnProperty;

var CHAR_BOM                  = 0xFEFF;
var CHAR_TAB                  = 0x09; /* Tab */
var CHAR_LINE_FEED            = 0x0A; /* LF */
var CHAR_CARRIAGE_RETURN      = 0x0D; /* CR */
var CHAR_SPACE                = 0x20; /* Space */
var CHAR_EXCLAMATION          = 0x21; /* ! */
var CHAR_DOUBLE_QUOTE         = 0x22; /* " */
var CHAR_SHARP                = 0x23; /* # */
var CHAR_PERCENT              = 0x25; /* % */
var CHAR_AMPERSAND            = 0x26; /* & */
var CHAR_SINGLE_QUOTE         = 0x27; /* ' */
var CHAR_ASTERISK             = 0x2A; /* * */
var CHAR_COMMA                = 0x2C; /* , */
var CHAR_MINUS                = 0x2D; /* - */
var CHAR_COLON                = 0x3A; /* : */
var CHAR_EQUALS               = 0x3D; /* = */
var CHAR_GREATER_THAN         = 0x3E; /* > */
var CHAR_QUESTION             = 0x3F; /* ? */
var CHAR_COMMERCIAL_AT        = 0x40; /* @ */
var CHAR_LEFT_SQUARE_BRACKET  = 0x5B; /* [ */
var CHAR_RIGHT_SQUARE_BRACKET = 0x5D; /* ] */
var CHAR_GRAVE_ACCENT         = 0x60; /* ` */
var CHAR_LEFT_CURLY_BRACKET   = 0x7B; /* { */
var CHAR_VERTICAL_LINE        = 0x7C; /* | */
var CHAR_RIGHT_CURLY_BRACKET  = 0x7D; /* } */

var ESCAPE_SEQUENCES = {};

ESCAPE_SEQUENCES[0x00]   = '\\0';
ESCAPE_SEQUENCES[0x07]   = '\\a';
ESCAPE_SEQUENCES[0x08]   = '\\b';
ESCAPE_SEQUENCES[0x09]   = '\\t';
ESCAPE_SEQUENCES[0x0A]   = '\\n';
ESCAPE_SEQUENCES[0x0B]   = '\\v';
ESCAPE_SEQUENCES[0x0C]   = '\\f';
ESCAPE_SEQUENCES[0x0D]   = '\\r';
ESCAPE_SEQUENCES[0x1B]   = '\\e';
ESCAPE_SEQUENCES[0x22]   = '\\"';
ESCAPE_SEQUENCES[0x5C]   = '\\\\';
ESCAPE_SEQUENCES[0x85]   = '\\N';
ESCAPE_SEQUENCES[0xA0]   = '\\_';
ESCAPE_SEQUENCES[0x2028] = '\\L';
ESCAPE_SEQUENCES[0x2029] = '\\P';

var DEPRECATED_BOOLEANS_SYNTAX = [
  'y', 'Y', 'yes', 'Yes', 'YES', 'on', 'On', 'ON',
  'n', 'N', 'no', 'No', 'NO', 'off', 'Off', 'OFF'
];

var DEPRECATED_BASE60_SYNTAX = /^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;

function compileStyleMap(schema, map) {
  var result, keys, index, length, tag, style, type;

  if (map === null) return {};

  result = {};
  keys = Object.keys(map);

  for (index = 0, length = keys.length; index < length; index += 1) {
    tag = keys[index];
    style = String(map[tag]);

    if (tag.slice(0, 2) === '!!') {
      tag = 'tag:yaml.org,2002:' + tag.slice(2);
    }
    type = schema.compiledTypeMap['fallback'][tag];

    if (type && _hasOwnProperty.call(type.styleAliases, style)) {
      style = type.styleAliases[style];
    }

    result[tag] = style;
  }

  return result;
}

function encodeHex(character) {
  var string, handle, length;

  string = character.toString(16).toUpperCase();

  if (character <= 0xFF) {
    handle = 'x';
    length = 2;
  } else if (character <= 0xFFFF) {
    handle = 'u';
    length = 4;
  } else if (character <= 0xFFFFFFFF) {
    handle = 'U';
    length = 8;
  } else {
    throw new exception('code point within a string may not be greater than 0xFFFFFFFF');
  }

  return '\\' + handle + common.repeat('0', length - string.length) + string;
}


var QUOTING_TYPE_SINGLE = 1,
    QUOTING_TYPE_DOUBLE = 2;

function State(options) {
  this.schema        = options['schema'] || _default;
  this.indent        = Math.max(1, (options['indent'] || 2));
  this.noArrayIndent = options['noArrayIndent'] || false;
  this.skipInvalid   = options['skipInvalid'] || false;
  this.flowLevel     = (common.isNothing(options['flowLevel']) ? -1 : options['flowLevel']);
  this.styleMap      = compileStyleMap(this.schema, options['styles'] || null);
  this.sortKeys      = options['sortKeys'] || false;
  this.lineWidth     = options['lineWidth'] || 80;
  this.noRefs        = options['noRefs'] || false;
  this.noCompatMode  = options['noCompatMode'] || false;
  this.condenseFlow  = options['condenseFlow'] || false;
  this.quotingType   = options['quotingType'] === '"' ? QUOTING_TYPE_DOUBLE : QUOTING_TYPE_SINGLE;
  this.forceQuotes   = options['forceQuotes'] || false;
  this.replacer      = typeof options['replacer'] === 'function' ? options['replacer'] : null;

  this.implicitTypes = this.schema.compiledImplicit;
  this.explicitTypes = this.schema.compiledExplicit;

  this.tag = null;
  this.result = '';

  this.duplicates = [];
  this.usedDuplicates = null;
}

// Indents every line in a string. Empty lines (\n only) are not indented.
function indentString(string, spaces) {
  var ind = common.repeat(' ', spaces),
      position = 0,
      next = -1,
      result = '',
      line,
      length = string.length;

  while (position < length) {
    next = string.indexOf('\n', position);
    if (next === -1) {
      line = string.slice(position);
      position = length;
    } else {
      line = string.slice(position, next + 1);
      position = next + 1;
    }

    if (line.length && line !== '\n') result += ind;

    result += line;
  }

  return result;
}

function generateNextLine(state, level) {
  return '\n' + common.repeat(' ', state.indent * level);
}

function testImplicitResolving(state, str) {
  var index, length, type;

  for (index = 0, length = state.implicitTypes.length; index < length; index += 1) {
    type = state.implicitTypes[index];

    if (type.resolve(str)) {
      return true;
    }
  }

  return false;
}

// [33] s-white ::= s-space | s-tab
function isWhitespace(c) {
  return c === CHAR_SPACE || c === CHAR_TAB;
}

// Returns true if the character can be printed without escaping.
// From YAML 1.2: "any allowed characters known to be non-printable
// should also be escaped. [However,] This isn’t mandatory"
// Derived from nb-char - \t - #x85 - #xA0 - #x2028 - #x2029.
function isPrintable(c) {
  return  (0x00020 <= c && c <= 0x00007E)
      || ((0x000A1 <= c && c <= 0x00D7FF) && c !== 0x2028 && c !== 0x2029)
      || ((0x0E000 <= c && c <= 0x00FFFD) && c !== CHAR_BOM)
      ||  (0x10000 <= c && c <= 0x10FFFF);
}

// [34] ns-char ::= nb-char - s-white
// [27] nb-char ::= c-printable - b-char - c-byte-order-mark
// [26] b-char  ::= b-line-feed | b-carriage-return
// Including s-white (for some reason, examples doesn't match specs in this aspect)
// ns-char ::= c-printable - b-line-feed - b-carriage-return - c-byte-order-mark
function isNsCharOrWhitespace(c) {
  return isPrintable(c)
    && c !== CHAR_BOM
    // - b-char
    && c !== CHAR_CARRIAGE_RETURN
    && c !== CHAR_LINE_FEED;
}

// [127]  ns-plain-safe(c) ::= c = flow-out  ⇒ ns-plain-safe-out
//                             c = flow-in   ⇒ ns-plain-safe-in
//                             c = block-key ⇒ ns-plain-safe-out
//                             c = flow-key  ⇒ ns-plain-safe-in
// [128] ns-plain-safe-out ::= ns-char
// [129]  ns-plain-safe-in ::= ns-char - c-flow-indicator
// [130]  ns-plain-char(c) ::=  ( ns-plain-safe(c) - “:” - “#” )
//                            | ( /* An ns-char preceding */ “#” )
//                            | ( “:” /* Followed by an ns-plain-safe(c) */ )
function isPlainSafe(c, prev, inblock) {
  var cIsNsCharOrWhitespace = isNsCharOrWhitespace(c);
  var cIsNsChar = cIsNsCharOrWhitespace && !isWhitespace(c);
  return (
    // ns-plain-safe
    inblock ? // c = flow-in
      cIsNsCharOrWhitespace
      : cIsNsCharOrWhitespace
        // - c-flow-indicator
        && c !== CHAR_COMMA
        && c !== CHAR_LEFT_SQUARE_BRACKET
        && c !== CHAR_RIGHT_SQUARE_BRACKET
        && c !== CHAR_LEFT_CURLY_BRACKET
        && c !== CHAR_RIGHT_CURLY_BRACKET
  )
    // ns-plain-char
    && c !== CHAR_SHARP // false on '#'
    && !(prev === CHAR_COLON && !cIsNsChar) // false on ': '
    || (isNsCharOrWhitespace(prev) && !isWhitespace(prev) && c === CHAR_SHARP) // change to true on '[^ ]#'
    || (prev === CHAR_COLON && cIsNsChar); // change to true on ':[^ ]'
}

// Simplified test for values allowed as the first character in plain style.
function isPlainSafeFirst(c) {
  // Uses a subset of ns-char - c-indicator
  // where ns-char = nb-char - s-white.
  // No support of ( ( “?” | “:” | “-” ) /* Followed by an ns-plain-safe(c)) */ ) part
  return isPrintable(c) && c !== CHAR_BOM
    && !isWhitespace(c) // - s-white
    // - (c-indicator ::=
    // “-” | “?” | “:” | “,” | “[” | “]” | “{” | “}”
    && c !== CHAR_MINUS
    && c !== CHAR_QUESTION
    && c !== CHAR_COLON
    && c !== CHAR_COMMA
    && c !== CHAR_LEFT_SQUARE_BRACKET
    && c !== CHAR_RIGHT_SQUARE_BRACKET
    && c !== CHAR_LEFT_CURLY_BRACKET
    && c !== CHAR_RIGHT_CURLY_BRACKET
    // | “#” | “&” | “*” | “!” | “|” | “=” | “>” | “'” | “"”
    && c !== CHAR_SHARP
    && c !== CHAR_AMPERSAND
    && c !== CHAR_ASTERISK
    && c !== CHAR_EXCLAMATION
    && c !== CHAR_VERTICAL_LINE
    && c !== CHAR_EQUALS
    && c !== CHAR_GREATER_THAN
    && c !== CHAR_SINGLE_QUOTE
    && c !== CHAR_DOUBLE_QUOTE
    // | “%” | “@” | “`”)
    && c !== CHAR_PERCENT
    && c !== CHAR_COMMERCIAL_AT
    && c !== CHAR_GRAVE_ACCENT;
}

// Simplified test for values allowed as the last character in plain style.
function isPlainSafeLast(c) {
  // just not whitespace or colon, it will be checked to be plain character later
  return !isWhitespace(c) && c !== CHAR_COLON;
}

// Same as 'string'.codePointAt(pos), but works in older browsers.
function codePointAt(string, pos) {
  var first = string.charCodeAt(pos), second;
  if (first >= 0xD800 && first <= 0xDBFF && pos + 1 < string.length) {
    second = string.charCodeAt(pos + 1);
    if (second >= 0xDC00 && second <= 0xDFFF) {
      // https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
      return (first - 0xD800) * 0x400 + second - 0xDC00 + 0x10000;
    }
  }
  return first;
}

// Determines whether block indentation indicator is required.
function needIndentIndicator(string) {
  var leadingSpaceRe = /^\n* /;
  return leadingSpaceRe.test(string);
}

var STYLE_PLAIN   = 1,
    STYLE_SINGLE  = 2,
    STYLE_LITERAL = 3,
    STYLE_FOLDED  = 4,
    STYLE_DOUBLE  = 5;

// Determines which scalar styles are possible and returns the preferred style.
// lineWidth = -1 => no limit.
// Pre-conditions: str.length > 0.
// Post-conditions:
//    STYLE_PLAIN or STYLE_SINGLE => no \n are in the string.
//    STYLE_LITERAL => no lines are suitable for folding (or lineWidth is -1).
//    STYLE_FOLDED => a line > lineWidth and can be folded (and lineWidth != -1).
function chooseScalarStyle(string, singleLineOnly, indentPerLevel, lineWidth,
  testAmbiguousType, quotingType, forceQuotes, inblock) {

  var i;
  var char = 0;
  var prevChar = null;
  var hasLineBreak = false;
  var hasFoldableLine = false; // only checked if shouldTrackWidth
  var shouldTrackWidth = lineWidth !== -1;
  var previousLineBreak = -1; // count the first line correctly
  var plain = isPlainSafeFirst(codePointAt(string, 0))
          && isPlainSafeLast(codePointAt(string, string.length - 1));

  if (singleLineOnly || forceQuotes) {
    // Case: no block styles.
    // Check for disallowed characters to rule out plain and single.
    for (i = 0; i < string.length; char >= 0x10000 ? i += 2 : i++) {
      char = codePointAt(string, i);
      if (!isPrintable(char)) {
        return STYLE_DOUBLE;
      }
      plain = plain && isPlainSafe(char, prevChar, inblock);
      prevChar = char;
    }
  } else {
    // Case: block styles permitted.
    for (i = 0; i < string.length; char >= 0x10000 ? i += 2 : i++) {
      char = codePointAt(string, i);
      if (char === CHAR_LINE_FEED) {
        hasLineBreak = true;
        // Check if any line can be folded.
        if (shouldTrackWidth) {
          hasFoldableLine = hasFoldableLine ||
            // Foldable line = too long, and not more-indented.
            (i - previousLineBreak - 1 > lineWidth &&
             string[previousLineBreak + 1] !== ' ');
          previousLineBreak = i;
        }
      } else if (!isPrintable(char)) {
        return STYLE_DOUBLE;
      }
      plain = plain && isPlainSafe(char, prevChar, inblock);
      prevChar = char;
    }
    // in case the end is missing a \n
    hasFoldableLine = hasFoldableLine || (shouldTrackWidth &&
      (i - previousLineBreak - 1 > lineWidth &&
       string[previousLineBreak + 1] !== ' '));
  }
  // Although every style can represent \n without escaping, prefer block styles
  // for multiline, since they're more readable and they don't add empty lines.
  // Also prefer folding a super-long line.
  if (!hasLineBreak && !hasFoldableLine) {
    // Strings interpretable as another type have to be quoted;
    // e.g. the string 'true' vs. the boolean true.
    if (plain && !forceQuotes && !testAmbiguousType(string)) {
      return STYLE_PLAIN;
    }
    return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
  }
  // Edge case: block indentation indicator can only have one digit.
  if (indentPerLevel > 9 && needIndentIndicator(string)) {
    return STYLE_DOUBLE;
  }
  // At this point we know block styles are valid.
  // Prefer literal style unless we want to fold.
  if (!forceQuotes) {
    return hasFoldableLine ? STYLE_FOLDED : STYLE_LITERAL;
  }
  return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
}

// Note: line breaking/folding is implemented for only the folded style.
// NB. We drop the last trailing newline (if any) of a returned block scalar
//  since the dumper adds its own newline. This always works:
//    • No ending newline => unaffected; already using strip "-" chomping.
//    • Ending newline    => removed then restored.
//  Importantly, this keeps the "+" chomp indicator from gaining an extra line.
function writeScalar(state, string, level, iskey, inblock) {
  state.dump = (function () {
    if (string.length === 0) {
      return state.quotingType === QUOTING_TYPE_DOUBLE ? '""' : "''";
    }
    if (!state.noCompatMode) {
      if (DEPRECATED_BOOLEANS_SYNTAX.indexOf(string) !== -1 || DEPRECATED_BASE60_SYNTAX.test(string)) {
        return state.quotingType === QUOTING_TYPE_DOUBLE ? ('"' + string + '"') : ("'" + string + "'");
      }
    }

    var indent = state.indent * Math.max(1, level); // no 0-indent scalars
    // As indentation gets deeper, let the width decrease monotonically
    // to the lower bound min(state.lineWidth, 40).
    // Note that this implies
    //  state.lineWidth ≤ 40 + state.indent: width is fixed at the lower bound.
    //  state.lineWidth > 40 + state.indent: width decreases until the lower bound.
    // This behaves better than a constant minimum width which disallows narrower options,
    // or an indent threshold which causes the width to suddenly increase.
    var lineWidth = state.lineWidth === -1
      ? -1 : Math.max(Math.min(state.lineWidth, 40), state.lineWidth - indent);

    // Without knowing if keys are implicit/explicit, assume implicit for safety.
    var singleLineOnly = iskey
      // No block styles in flow mode.
      || (state.flowLevel > -1 && level >= state.flowLevel);
    function testAmbiguity(string) {
      return testImplicitResolving(state, string);
    }

    switch (chooseScalarStyle(string, singleLineOnly, state.indent, lineWidth,
      testAmbiguity, state.quotingType, state.forceQuotes && !iskey, inblock)) {

      case STYLE_PLAIN:
        return string;
      case STYLE_SINGLE:
        return "'" + string.replace(/'/g, "''") + "'";
      case STYLE_LITERAL:
        return '|' + blockHeader(string, state.indent)
          + dropEndingNewline(indentString(string, indent));
      case STYLE_FOLDED:
        return '>' + blockHeader(string, state.indent)
          + dropEndingNewline(indentString(foldString(string, lineWidth), indent));
      case STYLE_DOUBLE:
        return '"' + escapeString(string) + '"';
      default:
        throw new exception('impossible error: invalid scalar style');
    }
  }());
}

// Pre-conditions: string is valid for a block scalar, 1 <= indentPerLevel <= 9.
function blockHeader(string, indentPerLevel) {
  var indentIndicator = needIndentIndicator(string) ? String(indentPerLevel) : '';

  // note the special case: the string '\n' counts as a "trailing" empty line.
  var clip =          string[string.length - 1] === '\n';
  var keep = clip && (string[string.length - 2] === '\n' || string === '\n');
  var chomp = keep ? '+' : (clip ? '' : '-');

  return indentIndicator + chomp + '\n';
}

// (See the note for writeScalar.)
function dropEndingNewline(string) {
  return string[string.length - 1] === '\n' ? string.slice(0, -1) : string;
}

// Note: a long line without a suitable break point will exceed the width limit.
// Pre-conditions: every char in str isPrintable, str.length > 0, width > 0.
function foldString(string, width) {
  // In folded style, $k$ consecutive newlines output as $k+1$ newlines—
  // unless they're before or after a more-indented line, or at the very
  // beginning or end, in which case $k$ maps to $k$.
  // Therefore, parse each chunk as newline(s) followed by a content line.
  var lineRe = /(\n+)([^\n]*)/g;

  // first line (possibly an empty line)
  var result = (function () {
    var nextLF = string.indexOf('\n');
    nextLF = nextLF !== -1 ? nextLF : string.length;
    lineRe.lastIndex = nextLF;
    return foldLine(string.slice(0, nextLF), width);
  }());
  // If we haven't reached the first content line yet, don't add an extra \n.
  var prevMoreIndented = string[0] === '\n' || string[0] === ' ';
  var moreIndented;

  // rest of the lines
  var match;
  while ((match = lineRe.exec(string))) {
    var prefix = match[1], line = match[2];
    moreIndented = (line[0] === ' ');
    result += prefix
      + (!prevMoreIndented && !moreIndented && line !== ''
        ? '\n' : '')
      + foldLine(line, width);
    prevMoreIndented = moreIndented;
  }

  return result;
}

// Greedy line breaking.
// Picks the longest line under the limit each time,
// otherwise settles for the shortest line over the limit.
// NB. More-indented lines *cannot* be folded, as that would add an extra \n.
function foldLine(line, width) {
  if (line === '' || line[0] === ' ') return line;

  // Since a more-indented line adds a \n, breaks can't be followed by a space.
  var breakRe = / [^ ]/g; // note: the match index will always be <= length-2.
  var match;
  // start is an inclusive index. end, curr, and next are exclusive.
  var start = 0, end, curr = 0, next = 0;
  var result = '';

  // Invariants: 0 <= start <= length-1.
  //   0 <= curr <= next <= max(0, length-2). curr - start <= width.
  // Inside the loop:
  //   A match implies length >= 2, so curr and next are <= length-2.
  while ((match = breakRe.exec(line))) {
    next = match.index;
    // maintain invariant: curr - start <= width
    if (next - start > width) {
      end = (curr > start) ? curr : next; // derive end <= length-2
      result += '\n' + line.slice(start, end);
      // skip the space that was output as \n
      start = end + 1;                    // derive start <= length-1
    }
    curr = next;
  }

  // By the invariants, start <= length-1, so there is something left over.
  // It is either the whole string or a part starting from non-whitespace.
  result += '\n';
  // Insert a break if the remainder is too long and there is a break available.
  if (line.length - start > width && curr > start) {
    result += line.slice(start, curr) + '\n' + line.slice(curr + 1);
  } else {
    result += line.slice(start);
  }

  return result.slice(1); // drop extra \n joiner
}

// Escapes a double-quoted string.
function escapeString(string) {
  var result = '';
  var char = 0;
  var escapeSeq;

  for (var i = 0; i < string.length; char >= 0x10000 ? i += 2 : i++) {
    char = codePointAt(string, i);
    escapeSeq = ESCAPE_SEQUENCES[char];

    if (!escapeSeq && isPrintable(char)) {
      result += string[i];
      if (char >= 0x10000) result += string[i + 1];
    } else {
      result += escapeSeq || encodeHex(char);
    }
  }

  return result;
}

function writeFlowSequence(state, level, object) {
  var _result = '',
      _tag    = state.tag,
      index,
      length,
      value;

  for (index = 0, length = object.length; index < length; index += 1) {
    value = object[index];

    if (state.replacer) {
      value = state.replacer.call(object, String(index), value);
    }

    // Write only valid elements, put null instead of invalid elements.
    if (writeNode(state, level, value, false, false) ||
        (typeof value === 'undefined' &&
         writeNode(state, level, null, false, false))) {

      if (_result !== '') _result += ',' + (!state.condenseFlow ? ' ' : '');
      _result += state.dump;
    }
  }

  state.tag = _tag;
  state.dump = '[' + _result + ']';
}

function writeBlockSequence(state, level, object, compact) {
  var _result = '',
      _tag    = state.tag,
      index,
      length,
      value;

  for (index = 0, length = object.length; index < length; index += 1) {
    value = object[index];

    if (state.replacer) {
      value = state.replacer.call(object, String(index), value);
    }

    // Write only valid elements, put null instead of invalid elements.
    if (writeNode(state, level + 1, value, true, true, false, true) ||
        (typeof value === 'undefined' &&
         writeNode(state, level + 1, null, true, true, false, true))) {

      if (!compact || _result !== '') {
        _result += generateNextLine(state, level);
      }

      if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
        _result += '-';
      } else {
        _result += '- ';
      }

      _result += state.dump;
    }
  }

  state.tag = _tag;
  state.dump = _result || '[]'; // Empty sequence if no valid values.
}

function writeFlowMapping(state, level, object) {
  var _result       = '',
      _tag          = state.tag,
      objectKeyList = Object.keys(object),
      index,
      length,
      objectKey,
      objectValue,
      pairBuffer;

  for (index = 0, length = objectKeyList.length; index < length; index += 1) {

    pairBuffer = '';
    if (_result !== '') pairBuffer += ', ';

    if (state.condenseFlow) pairBuffer += '"';

    objectKey = objectKeyList[index];
    objectValue = object[objectKey];

    if (state.replacer) {
      objectValue = state.replacer.call(object, objectKey, objectValue);
    }

    if (!writeNode(state, level, objectKey, false, false)) {
      continue; // Skip this pair because of invalid key;
    }

    if (state.dump.length > 1024) pairBuffer += '? ';

    pairBuffer += state.dump + (state.condenseFlow ? '"' : '') + ':' + (state.condenseFlow ? '' : ' ');

    if (!writeNode(state, level, objectValue, false, false)) {
      continue; // Skip this pair because of invalid value.
    }

    pairBuffer += state.dump;

    // Both key and value are valid.
    _result += pairBuffer;
  }

  state.tag = _tag;
  state.dump = '{' + _result + '}';
}

function writeBlockMapping(state, level, object, compact) {
  var _result       = '',
      _tag          = state.tag,
      objectKeyList = Object.keys(object),
      index,
      length,
      objectKey,
      objectValue,
      explicitPair,
      pairBuffer;

  // Allow sorting keys so that the output file is deterministic
  if (state.sortKeys === true) {
    // Default sorting
    objectKeyList.sort();
  } else if (typeof state.sortKeys === 'function') {
    // Custom sort function
    objectKeyList.sort(state.sortKeys);
  } else if (state.sortKeys) {
    // Something is wrong
    throw new exception('sortKeys must be a boolean or a function');
  }

  for (index = 0, length = objectKeyList.length; index < length; index += 1) {
    pairBuffer = '';

    if (!compact || _result !== '') {
      pairBuffer += generateNextLine(state, level);
    }

    objectKey = objectKeyList[index];
    objectValue = object[objectKey];

    if (state.replacer) {
      objectValue = state.replacer.call(object, objectKey, objectValue);
    }

    if (!writeNode(state, level + 1, objectKey, true, true, true)) {
      continue; // Skip this pair because of invalid key.
    }

    explicitPair = (state.tag !== null && state.tag !== '?') ||
                   (state.dump && state.dump.length > 1024);

    if (explicitPair) {
      if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
        pairBuffer += '?';
      } else {
        pairBuffer += '? ';
      }
    }

    pairBuffer += state.dump;

    if (explicitPair) {
      pairBuffer += generateNextLine(state, level);
    }

    if (!writeNode(state, level + 1, objectValue, true, explicitPair)) {
      continue; // Skip this pair because of invalid value.
    }

    if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
      pairBuffer += ':';
    } else {
      pairBuffer += ': ';
    }

    pairBuffer += state.dump;

    // Both key and value are valid.
    _result += pairBuffer;
  }

  state.tag = _tag;
  state.dump = _result || '{}'; // Empty mapping if no valid pairs.
}

function detectType(state, object, explicit) {
  var _result, typeList, index, length, type, style;

  typeList = explicit ? state.explicitTypes : state.implicitTypes;

  for (index = 0, length = typeList.length; index < length; index += 1) {
    type = typeList[index];

    if ((type.instanceOf  || type.predicate) &&
        (!type.instanceOf || ((typeof object === 'object') && (object instanceof type.instanceOf))) &&
        (!type.predicate  || type.predicate(object))) {

      if (explicit) {
        if (type.multi && type.representName) {
          state.tag = type.representName(object);
        } else {
          state.tag = type.tag;
        }
      } else {
        state.tag = '?';
      }

      if (type.represent) {
        style = state.styleMap[type.tag] || type.defaultStyle;

        if (_toString.call(type.represent) === '[object Function]') {
          _result = type.represent(object, style);
        } else if (_hasOwnProperty.call(type.represent, style)) {
          _result = type.represent[style](object, style);
        } else {
          throw new exception('!<' + type.tag + '> tag resolver accepts not "' + style + '" style');
        }

        state.dump = _result;
      }

      return true;
    }
  }

  return false;
}

// Serializes `object` and writes it to global `result`.
// Returns true on success, or false on invalid object.
//
function writeNode(state, level, object, block, compact, iskey, isblockseq) {
  state.tag = null;
  state.dump = object;

  if (!detectType(state, object, false)) {
    detectType(state, object, true);
  }

  var type = _toString.call(state.dump);
  var inblock = block;
  var tagStr;

  if (block) {
    block = (state.flowLevel < 0 || state.flowLevel > level);
  }

  var objectOrArray = type === '[object Object]' || type === '[object Array]',
      duplicateIndex,
      duplicate;

  if (objectOrArray) {
    duplicateIndex = state.duplicates.indexOf(object);
    duplicate = duplicateIndex !== -1;
  }

  if ((state.tag !== null && state.tag !== '?') || duplicate || (state.indent !== 2 && level > 0)) {
    compact = false;
  }

  if (duplicate && state.usedDuplicates[duplicateIndex]) {
    state.dump = '*ref_' + duplicateIndex;
  } else {
    if (objectOrArray && duplicate && !state.usedDuplicates[duplicateIndex]) {
      state.usedDuplicates[duplicateIndex] = true;
    }
    if (type === '[object Object]') {
      if (block && (Object.keys(state.dump).length !== 0)) {
        writeBlockMapping(state, level, state.dump, compact);
        if (duplicate) {
          state.dump = '&ref_' + duplicateIndex + state.dump;
        }
      } else {
        writeFlowMapping(state, level, state.dump);
        if (duplicate) {
          state.dump = '&ref_' + duplicateIndex + ' ' + state.dump;
        }
      }
    } else if (type === '[object Array]') {
      if (block && (state.dump.length !== 0)) {
        if (state.noArrayIndent && !isblockseq && level > 0) {
          writeBlockSequence(state, level - 1, state.dump, compact);
        } else {
          writeBlockSequence(state, level, state.dump, compact);
        }
        if (duplicate) {
          state.dump = '&ref_' + duplicateIndex + state.dump;
        }
      } else {
        writeFlowSequence(state, level, state.dump);
        if (duplicate) {
          state.dump = '&ref_' + duplicateIndex + ' ' + state.dump;
        }
      }
    } else if (type === '[object String]') {
      if (state.tag !== '?') {
        writeScalar(state, state.dump, level, iskey, inblock);
      }
    } else if (type === '[object Undefined]') {
      return false;
    } else {
      if (state.skipInvalid) return false;
      throw new exception('unacceptable kind of an object to dump ' + type);
    }

    if (state.tag !== null && state.tag !== '?') {
      // Need to encode all characters except those allowed by the spec:
      //
      // [35] ns-dec-digit    ::=  [#x30-#x39] /* 0-9 */
      // [36] ns-hex-digit    ::=  ns-dec-digit
      //                         | [#x41-#x46] /* A-F */ | [#x61-#x66] /* a-f */
      // [37] ns-ascii-letter ::=  [#x41-#x5A] /* A-Z */ | [#x61-#x7A] /* a-z */
      // [38] ns-word-char    ::=  ns-dec-digit | ns-ascii-letter | “-”
      // [39] ns-uri-char     ::=  “%” ns-hex-digit ns-hex-digit | ns-word-char | “#”
      //                         | “;” | “/” | “?” | “:” | “@” | “&” | “=” | “+” | “$” | “,”
      //                         | “_” | “.” | “!” | “~” | “*” | “'” | “(” | “)” | “[” | “]”
      //
      // Also need to encode '!' because it has special meaning (end of tag prefix).
      //
      tagStr = encodeURI(
        state.tag[0] === '!' ? state.tag.slice(1) : state.tag
      ).replace(/!/g, '%21');

      if (state.tag[0] === '!') {
        tagStr = '!' + tagStr;
      } else if (tagStr.slice(0, 18) === 'tag:yaml.org,2002:') {
        tagStr = '!!' + tagStr.slice(18);
      } else {
        tagStr = '!<' + tagStr + '>';
      }

      state.dump = tagStr + ' ' + state.dump;
    }
  }

  return true;
}

function getDuplicateReferences(object, state) {
  var objects = [],
      duplicatesIndexes = [],
      index,
      length;

  inspectNode(object, objects, duplicatesIndexes);

  for (index = 0, length = duplicatesIndexes.length; index < length; index += 1) {
    state.duplicates.push(objects[duplicatesIndexes[index]]);
  }
  state.usedDuplicates = new Array(length);
}

function inspectNode(object, objects, duplicatesIndexes) {
  var objectKeyList,
      index,
      length;

  if (object !== null && typeof object === 'object') {
    index = objects.indexOf(object);
    if (index !== -1) {
      if (duplicatesIndexes.indexOf(index) === -1) {
        duplicatesIndexes.push(index);
      }
    } else {
      objects.push(object);

      if (Array.isArray(object)) {
        for (index = 0, length = object.length; index < length; index += 1) {
          inspectNode(object[index], objects, duplicatesIndexes);
        }
      } else {
        objectKeyList = Object.keys(object);

        for (index = 0, length = objectKeyList.length; index < length; index += 1) {
          inspectNode(object[objectKeyList[index]], objects, duplicatesIndexes);
        }
      }
    }
  }
}

function dump$1(input, options) {
  options = options || {};

  var state = new State(options);

  if (!state.noRefs) getDuplicateReferences(input, state);

  var value = input;

  if (state.replacer) {
    value = state.replacer.call({ '': value }, '', value);
  }

  if (writeNode(state, 0, value, true, true)) return state.dump + '\n';

  return '';
}

var dump_1 = dump$1;

var dumper = {
	dump: dump_1
};
var load                = loader.load;
var dump                = dumper.dump;

function yamlToObj(yamlStr) { return load(yamlStr); }
function objToYaml(obj, opts) { return dump(obj, opts); }
function dgFromYaml(yamlStr) {
    try {
        var obj = load(yamlStr);
        return dgFromObject(obj);
    }
    catch (e) {
        if (String(e).startsWith("YAMLException"))
            throw new Error("Error parsing YAML: \n" + e);
        else
            throw e;
    }
}
var DG_TYPE;
(function (DG_TYPE) {
    DG_TYPE["Main"] = "Main";
    DG_TYPE["Array"] = "Array";
    DG_TYPE["Diagram"] = "Diagram";
    DG_TYPE["CartesianGrid"] = "CartesianGrid";
    DG_TYPE["GeometricConstruction"] = "GeometricConstruction";
    DG_TYPE["Graph"] = "Graph";
    DG_TYPE["BoxPlot"] = "BoxPlot";
    DG_TYPE["Numberline"] = "Numberline";
})(DG_TYPE || (DG_TYPE = {}));
function dgFromObject(obj) {
    var _a;
    obj.styleProfiles = ["vretta", ...((_a = obj.styleProfiles) !== null && _a !== void 0 ? _a : [])];
    let type = obj["type"];
    if (Array.isArray(obj))
        type = DG_TYPE.Array;
    switch (type) {
        case DG_TYPE.Main: {
            let main = obj;
            let elements = main.elements;
            if (elements === undefined)
                return empty();
            if (!Array.isArray(elements))
                return empty();
            let diagrams = elements.map(dgFromObject);
            return diagram_combine(...diagrams);
        }
        case DG_TYPE.Array: {
            let elements = obj;
            let diagrams = elements.map(dgFromObject);
            return diagram_combine(...diagrams);
        }
        case DG_TYPE.Diagram: {
            return dg_Diagram(obj);
        }
        case DG_TYPE.CartesianGrid: {
            return dg_CartesianGrid(obj);
        }
        case DG_TYPE.GeometricConstruction: {
            return dg_GeometricConstruction(obj);
        }
        case DG_TYPE.Graph: {
            return dg_Graph(obj);
        }
        case DG_TYPE.BoxPlot: {
            return dg_BoxPlot(obj);
        }
        case DG_TYPE.Numberline: {
            return dg_Numberline(obj);
        }
    }
    assertNever("Unknown Diagram type: ", type);
}

export { Diagram, Interactive, Path, TAG, V2$5 as V2, Vdir, Vector2, _init_default_diagram_style, _init_default_text_diagram_style, _init_default_textdata, align_horizontal, align_vertical, shapes_annotation as annotation, arc, array_repeat, arrow, arrow1, arrow2, ax, axes_corner_empty, axes_empty, axes_transform, shapes_bar as bar, shapes_boxplot as boxplot, circle, clientPos_to_svgPos, cubic_spline, curve, default_diagram_style, default_text_diagram_style, default_textdata, dgFromObject, dgFromYaml, diagram_combine, distribute_grid_row, distribute_horizontal, distribute_horizontal_and_align, distribute_variable_row, distribute_vertical, distribute_vertical_and_align, download_svg_as_png, download_svg_as_svg, draw_to_svg, draw_to_svg_element, empty, encoding, geo_construct, shapes_geometry as geometry, get_SVGPos_from_event, get_tagged_svg_element, shapes_graph as graph, handle_tex_in_svg, image, line$1 as line, linspace, linspace_exc, shapes_mechanics as mechanics, modifier as mod, multiline, multiline_bb, shapes_numberline as numberline, objToYaml, plot$1 as plot, plotf, plotv, polygon, range, range_inc, rectangle, rectangle_corner, regular_polygon, regular_polygon_side, reset_default_styles, square, str_latex_to_unicode, str_to_mathematical_italic, styleprofile_list$1 as style, shapes_table as table, text, textvar, to_degree, to_radian, transpose, shapes_tree as tree, under_curvef, utils, xaxis, xgrid, xtickmark, xtickmark_empty, xticks, xyaxes, xycorneraxes, xygrid, constructions as yamlConstructions, yamlToObj, yaxis, ygrid, ytickmark, ytickmark_empty, yticks };
//# sourceMappingURL=diagramatics-ext-1.3.1-1-dev.js.map
