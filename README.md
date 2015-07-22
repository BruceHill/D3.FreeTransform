# D3.FreeTransform (alpha)
A port of Raphael.FreeTransform to D3. A freetransform tool for D3 that supports dragging, scaling and rotating of elements.

## License
Licensed under [MIT License]

## Demo
Full demo: http://jsfiddle.net/3ya4y7p1/
Simplified demo: http://jsfiddle.net/2o5g7v5a/

## Demo code
Here is the code from the simplified demo.  Note that the shapes are being instantiated from SVG strings using the D3.AppendSvg plugin that is included in the source for D3.FreeTransform. There is no separate repository for D3.AppendSvg at this stage.
### HTML
```html
<table>
    <tr>
        <td>Border Box:</td>
        <td><input id="bbox" type="checkbox" checked="checked" /></td>
    </tr>
</table>

<svg id="svg_tag" width="400" height="400" viewbox="0 0 400 400">
    <defs>
        <rect id="rectangle" width="90" height="90"  rx="30" stroke="#f89938"></rect>
    </defs>
</svg>
```

### Javascript
```javascript
(function() {
    var shapes = [
                    { id:1, x:80, y:60, _: { rotate:60 }, shape: '<use fill="white" xlink:href="#rectangle"></use>' },
                    { id:2, x:300, y:100, shape: '<circle id="circle" r="50" fill="grey" stroke="blue"></circle>' }
                 ];
    var svg = d3.select("#svg_tag");
    var ft = d3.freetransform();
    function reload() {        
        var s = svg.selectAll('g.shape').data(shapes, function(d) { return d.id });
        var enter = s.enter().insert("svg:g").attr('class', 'shape');
        enter.appendSvg(function(d) {
                   return d.shape
               }, 'shape-element resize');
        s.call(ft);
    }
    // Helpers
    function updateShapes(property, update) 
    {
        shapes.forEach(function(shape) {
            shape[property] = typeof update === 'function'? update(): update;
        }); 
    }
    // Events
    d3.select('#bbox').on('click', function() {
        var self = this;
        updateShapes('draw', function() {
            return self.checked? 'bbox': '';
        });
        reload();
    });
    reload();
})();
```

## Options
Options can either be set globally by calling the appropriate method to set the property default that will then be applied to all shapes or by defining an attribute in the data which sets the property value. Options set by means of data attributes will always take precedence over globally set defaults.

Here is an example of setting the _draw_ option to 'bbox' (display the border box on all elements in the selection):
```
var ft = d3.freetransform().draw('bbox');
```

Here is an example of setting the _draw_ attribute to '' (hide border box) inside the data element:
```
var shapes = [ { id:1, x:80, y:60, draw:'', shape: '<use fill="white" xlink:href="#rectangle"></use>' }]
```

### draw

Additional elements to draw.

Method: draw(string value)

Attribute: draw

Valid values: 'bbox' (show border box), '' (hide border box)

Default: 'bbox'

### scale

Enables/disables scaling.

Method: scale(num)

Attribute: scale

Valid flags: 'scxy'

Meaning of flags:

    | flag    | Meaning |
    | --------|-------- |
    | s       | side    |
    | c       | corner  |
    | x       | x-axis  |
    | y       | y-axis  |

Default: 'sc'

### rotate

Enables/disables rotating.

Method: rotate(flags)

Attribute: rotate

Valid flags: 'scxy'

Meaning of flags: 

    | flag    | Meaning |
    | --------|-------- |
    | s       | side    |
    | c       | corner  |
    | x       | x-axis  |
    | y       | y-axis  |

Default: 'x'

###keepRatio

Scale axes together or individually.

Method: keepRatio(flags)

Attribute: keepRatio

Valid flags: 'scxy'

Meaning of flags: 

    | flag    | Meaning |
    | --------|-------- |
    | s       | side    |
    | c       | corner  |
    | x       | x-axis  |
    | y       | y-axis  |


Default: ''

###distance

Sets the distance of the rotate handles from the center of the element (num times radius)

Method: distance(factor)

Attribute: distance

Default: 1.3

###snapRotate

Snap rotation transformations to num degrees.

Method: snapRotate(num)

Attribute: snapRotate

Default: 0 (snap is off)

### snapDistanceRotate

Snap distance in degrees to apply to snap rotation transformations.

Method: snapDistanceRotate(num)

Attribute: snapDistanceRotate

Default: 5

## rangeRotate

Limit the range of rotate transformations.

Method: rangeRotate([minimum degrees, maximum degrees] || false)

Attribute: rangeRotate

Default: false

### rangeScale

Limit the range of scale transformations.

Method: rangeScale([minimum range, maximum range] || false)

Attribute: rangeScale

Default: false







