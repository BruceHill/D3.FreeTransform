// ****************************************
// * D3.FreeTransform (alpha), 22-07-2015
// ****************************************
 
 /**
 * AppendSvg D3 Plugin
 */
(function() {
    var parseXml = (function() {
            var parser; 
            if (typeof window.DOMParser != "undefined") {
                parser = function(xmlStr) {
                    return ( new window.DOMParser() ).parseFromString(xmlStr, "text/xml");
                };
            } 
            else if (typeof window.ActiveXObject != "undefined" && new window.ActiveXObject("Microsoft.XMLDOM")) {
                parser = function(xmlStr) {
                    var xmlDoc = new window.ActiveXObject("Microsoft.XMLDOM");
                    xmlDoc.async = "false";
                    xmlDoc.loadXML(xmlStr);
                    return xmlDoc;
                };
            } 
            return parser;
        })();
    d3.selection.enter.prototype.appendSvg = d3.selection.prototype.appendSvg = function(svg, className) {
        this.each(d3_selection_appendsvg(svg, className));
    };
    
    d3_selection_appendsvg = function(svg, className) {
        var appendSvg = function(s) {
            var xml = parseXml('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" >'+s+'</svg>');
                 var importedNode = document.importNode(xml.documentElement.childNodes[0], true); 
                 d3.select(this).append(function() { return importedNode }).attr('class', className);
            },
            appendSvgFunction = function() {
                var s = svg.apply(this, arguments);
                appendSvg.call(this, s);
            }
        return typeof svg === 'function'? appendSvgFunction: appendSvg;
    }
})();

 /**
 * D3.FreeTransform Plugin
 */
(function() {
    
    // *******************************
    // * Default properties
    // *******************************
	var _ = {
        draw: 'bbox',
		rotate: 'x',  // xy x=x-axis, y=y-axis
		scale: 'cs',   // csxy c=corners, s=sides, x=x-axis, y=y-axis
        keepRatio: '',  // csxy c=corners, s=sides, x=x-axis, y=y-axis
		distance: 1.3,
		snapRotate: 0,
		snapDistanceRotate: 5,
		snapScale: 0,
		snapDistanceScale: 10,
		rangeRotate: null,
		rangeScale: null
	}
	
	// *******************************
    // * Plugin definition
    // *******************************
    d3.freetransform = function() {
        return d3_freetransform(false);
    };  
    
    function d3_freetransform(keepRatio) {
        var my = function() {
			this.each(function(d) {
					var $this = d3.select(this);
					initializeTransformationState.call(this, d);
					removeAllVisualElements.call($this, d);
					$this.call(shapeDrag);
					xAxisHandle.call($this, d);
					yAxisHandle.call($this, d);
					borderBox.call($this, d);
					borderHandles.call($this, d);
					applyTransformations.call($this, d);
			});    
        };
        // *******************************
        // * Properties
        // *******************************
		var buildProperty = function(name) {
			return function(value) {
			   if (!arguments.length) return _[name];
				   _[name] = value;
					   return my;
				}
			},
			getProperty = function(d, prop) {
				if (d.hasOwnProperty(prop)) {
					return d[prop];
				}
				return _[prop];
			};
        my.draw = buildProperty('draw');
        my.scale = buildProperty('scale');
		my.rotate = buildProperty('rotate');
		my.keepRatio = buildProperty('keepRatio');
		my.distance = buildProperty('distance');
		my.snapRotate = buildProperty('snapRotate');
		my.snapDistanceRotate = buildProperty('snapDistanceRotate');
		my.snapScale = buildProperty('snapScale');
		my.snapDistanceScale = buildProperty('snapDistanceScale');
		my.rangeScale = buildProperty('rangeRotate');
		my.rangeScale = buildProperty('rangeScale');
		
		// *******************************
        // * Functions
        // *******************************
        /**
         * function: initializeTransformationState
         */
        var initializeTransformationState = function(d) {   
			if (!d._) {
				d._ = {}
			} 
            if (!d._.initialBorderBox) {
            d._.initialBorderBox = this.getBBox();
            d._.center = getCenter(d._.initialBorderBox);
            }
            if (!d._.rotate) {
                d._.rotate = 0;
            }
            if (!d._.scale) {
                d._.scale = {
                    x: 1,
                    y: 1
                }
            }
            if (!d._.translate) {
                d._.translate = {
                    x: 0,
                    y: 0
                }
            }
            d._.ratio = d._.scale.x / d._.scale.y;
        };
		
		/**
         * function: removeAllVisualElements
         */
		var removeAllVisualElements = function() {
			// Remove border box
			this.selectAll('.bbox').remove();
			// Remove x-axis
			this.selectAll('.x-axis-line').remove();
			this.selectAll('.x-axis-disc').remove();
			// Remove y-axis
			this.selectAll('.y-axis-line').remove();
			this.selectAll('.y-axis-disc').remove();
			// Remove border handles
			this.selectAll('.resize-handle').remove();
		}

        /**
         * function: shapeDrag
         */
        var shapeDrag = (function() {
            var drag = d3.behavior.drag(),
                start = {
                    x: null,
                    y: null,
                    mouseX: null,
                    mouseY: null
                };
            drag.on('dragstart', function(d) {
                d3.event.sourceEvent.preventDefault();
                var position = d3.mouse(this.ownerSVGElement);
                start.x = d.x;
                start.y = d.y;
                start.mouseX = position[0];
                start.mouseY = position[1];
            });
            drag.on('drag', function(d) {
                var position = d3.mouse(this.ownerSVGElement);
                d.x = start.x + (position[0] - start.mouseX);
                d.y = start.y + (position[1] - start.mouseY);
                d3.select(this).call(applyTransformations);
            });
            return drag;
        })();
		
		/**
         * function: createAxisHandle
         */
		var createAxisHandle = function(axis) {
			var axisHandle = function(d) {
				if (getProperty(d, 'rotate').indexOf(axis) !== -1 || getProperty(d, 'scale').indexOf(axis) !== -1) {
  				    this.append('svg:path')
						.attr({
							'd': lineFunction([{
								x: d._.center.x,
								y: d._.center.y
							}]),
							'class': axis+'-axis-line',
							'stroke-dasharray': '4,3',
							'stroke': 'gray',
							'stroke-width': 2,
							'opacity': 0.5
						});
					this.append('svg:circle')
						 .attr({
							'r': 5,
							'class': axis+'-axis-disc',
							'fill': '#fff',
							'stroke': 'gray',
							'stroke-width': 1
						 })
						 .call(axisHandleDrag);
				}
			}

			/**
			 * function: axisHandleDrag
			 */
			var axisHandleDrag = (function() {
				var drag = d3.behavior.drag(),
					initial, rotate, scale;
				drag.on('dragstart', function(d) {
					d3.event.sourceEvent.stopPropagation();
					d3.event.sourceEvent.preventDefault();
					var mouse = d3.mouse(this.ownerSVGElement);
					initial = {
						cx: parseFloat(this.getAttribute('cx')),
						cy: parseFloat(this.getAttribute('cy')),
						center: cloneObj(d._.center),
						translate: cloneObj(d._.translate),
						scale: cloneObj(d._.scale),
						mouseX: mouse[0],
						mouseY: mouse[1]
					};
					rotate = getProperty(d, 'rotate').indexOf(axis) !== -1;
				    scale  = getProperty(d, 'scale').indexOf(axis) !== -1;
				});

				drag.on('drag', function(d) {
					var mouse = d3.mouse(this.ownerSVGElement),
						dx = mouse[0] - initial.mouseX,
						dy = mouse[1] - initial.mouseY;

					var cx = dx + initial.cx,
						cy = dy + initial.cy,
						mirrored = { 
							x: initial.scale.x < 0, 
							y: initial.scale.y < 0
						}

					if (rotate) {
					    var rad = Math.atan2(cy - initial.center.y - initial.translate.y, cx - initial.center.x - initial.translate.x);
						d._.rotate = rad * 180 / Math.PI - (axis === 'y' ? 90 : 0);

						if (mirrored[axis]) {
							d._.rotate -= 180;
						}
					}

					if (scale) {
						var radius = Math.sqrt(Math.pow(cx - d._.center.x - d._.translate.x, 2) + Math.pow(cy - d._.center.y - d._.translate.y, 2)),
						    initialRadius = {
								x: d._.initialBorderBox.width / 2,
								y: d._.initialBorderBox.height / 2
							},
							offset = Math.max(initialRadius.x , initialRadius.y) * (getProperty(d, 'distance') - 1);
						d._.scale[axis] = (radius - offset) / initialRadius[axis];
						if (mirrored[axis]) {
							d._.scale[axis] *= -1;
						}
					}
					
					applyLimits(d);

					// Maintain aspect ratio
					if (getProperty(d, 'keepRatio').indexOf(axis) !== -1) {
						if (axis === 'x') {
							d._.scale.y = d._.scale.x / d._.ratio;
						} else {
							d._.scale.x = d._.scale.y * d._.ratio;
						}
					} else {
						d._.ratio = d._.scale.x / d._.scale.y;
					}
					d3.select(this.parentNode).call(applyTransformations);
				});
				return drag;
			})();
			return axisHandle;
		}

	    /**
         * function: createRefreshAxisHandle
         */
		var createRefreshAxisHandle = function(axis) {
			var refreshAxisHandle = function() {
				this.each(function(d) {
					var $this = d3.select(this),
					    rad = {
							x: degreesToRadians(d._.rotate),
							y: degreesToRadians(d._.rotate + 90)
						},
						radius = {
							x: d._.initialBorderBox.width / 2 * d._.scale.x,
							y: d._.initialBorderBox.height /2 * d._.scale.y
						},
						offset = Math.max(d._.initialBorderBox.width/2, d._.initialBorderBox.height/2) * (getProperty(d, 'distance') - 1),
						cx = d._.center.x + d._.translate.x + (radius[axis] + offset) * Math.cos(rad[axis]),
						cy = d._.center.y + d._.translate.y + (radius[axis] + offset) * Math.sin(rad[axis]);

					$this.selectAll('.'+axis+'-axis-line').attr({
						'd': lineFunction([{
							x: d._.center.x + d._.translate.x,
							y: d._.center.y + d._.translate.y
						}, {
							x: cx,
							y: cy
						}])
					});
					$this.selectAll('.'+axis+'-axis-disc').attr({
						cx: cx,
						cy: cy
					});
				});
			}
			return refreshAxisHandle;
		}
		
		/**
		 * method xAxisHandle
		 */
		var xAxisHandle = createAxisHandle('x');
		
		/**
		 * method xAxisHandle
		 */
		var yAxisHandle = createAxisHandle('y');
		
		/**
		 * method refreshXAxisHandle
		 */
		var refreshXAxisHandle = createRefreshAxisHandle('x');
		
		/**
		 * method refreshYAxisHandle
		 */
		var refreshYAxisHandle = createRefreshAxisHandle('y');

        /**
         * function: borderBox
         */
        var borderBox = function(d) {
	        if (getProperty(d, 'draw').indexOf('bbox') != -1) {
                this.append('svg:path').attr('d', function(d) {
                   			    return lineFunction(getCorners(d._.center, d._.initialBorderBox, d._.rotate, d._.translate, d._.scale));
                		        })
                		       .attr({
                                          'class': 'bbox',
                                          'stroke-dasharray': '4,3',
                                          'stroke': '#000',
                                          'fill': 'none',
                                          'opacity': 0.5
                                     });
            }
        }

        /**
         * function: refreshBorderBox
         */
        var refreshBorderBox = function() {
            this.selectAll('.bbox').attr('d', function(d) {
                return lineFunction(getCorners(d._.center, d._.initialBorderBox, d._.rotate, d._.translate, d._.scale));
            });
        }

        /**
         * function: borderHandles
         */
        var borderHandles = function(d) {
		    if (getProperty(d, 'draw').indexOf('bbox') != -1) {
				var axis, isCorner;
				var corners = getCorners(d._.center, d._.initialBorderBox, d._.rotate, d._.translate, d._.scale);
				var handleDirection = [
					[-1, -1],
					[1, -1],
					[1, 1],
					[-1, 1],
					[0, -1],
					[1, 0],
					[0, 1],
					[-1, 0]
				];
				for (var i = (getProperty(d,'scale').indexOf('c') >= 0 ? 0 : 4); i < (getProperty(d, 'scale').indexOf('s') === -1 ? 4 : 8); i++) {
					this.append('svg:rect')
						.attr('axis', i % 2 ? 'x' : 'y')
						.attr('isCorner', i < 4)
						.attr('handle-direction-x', handleDirection[i][0])
						.attr('handle-direction-y', handleDirection[i][1]) 
						.attr({
							'class': 'resize-handle',
							'width': 10,
							'height': 10,
							'fill': 'white',
							'stroke': 'gray'
						})
						.call(borderHandleDrag);
				};
			}
        }

        /**
         * function: refreshBorderHandles
         */
        var refreshBorderHandles = function() {
            this.selectAll('.resize-handle').each(function(d, i) {
                var cx, cy,
                    corners = getCorners(d._.center, d._.initialBorderBox, d._.rotate, d._.translate, d._.scale);
                if (this.getAttribute('isCorner') == 'true') {
                    cx = corners[i].x;
                    cy = corners[i].y;
                } else {
                    var j = i % 4,
                        k = (j + 1) % corners.length;
                    cx = (corners[j].x + corners[k].x) / 2;
                    cy = (corners[j].y + corners[k].y) / 2;
                }
                d3.select(this).attr({
                    'x': cx - 5,
                    'y': cy - 5,
                    'transform': 'rotate(' + d._.rotate + ' ' + cx + ' ' + cy + ')'
                });
            });
        }

        /**
         * function: borderHandleDrag
         */
        var borderHandleDrag = (function() {
            var drag = d3.behavior.drag(),
                sin, cos, handlePos, o,
                start = {
                    x: null,
                    y: null,
                    mouseX: null,
                    mouseY: null
                };
            drag.on('dragstart', function(d) {
                d3.event.sourceEvent.stopPropagation();
                d3.event.sourceEvent.preventDefault();
                var rotate = ((360 - d._.rotate) % 360) / 180 * Math.PI,
                    mouse = d3.mouse(this.ownerSVGElement);
                sin = Math.sin(rotate); /* Pre-compute rotation sin & cos for efficiency */
                cos = Math.cos(rotate);
                o = cloneObj(d);
                handlePos = {
                    cx: (parseInt(this.getAttribute('x'))) + 5, // ft.opts.size[handle.isCorner ? 'bboxCorners' : 'bboxSides'],
                    cy: (parseInt(this.getAttribute('y'))) + 5 // ft.opts.size[handle.isCorner ? 'bboxCorners' : 'bboxSides']
                };
                start.x = d.x;
                start.y = d.y;
                start.mouseX = mouse[0];
                start.mouseY = mouse[1];
            });
            drag.on('drag', function(d) {
			
				var rotateToElement = function(p) {
					return {
						x: p.x * cos - p.y * sin,
						y: p.x * sin + p.y * cos
					}
				}
				var rotateToCanvas = function(p) {
					return {
						x: p.x * cos + p.y * sin,
						y: p.x * -sin + p.y * cos
					}
				}
				
				var getElementIncrement = function(dxDyToElement, handleDirection)
				{
					return {
						x: dxDyToElement.x *= Math.abs(handleDirection.x),
					    y: dxDyToElement.y *= Math.abs(handleDirection.y)
					}
				}
					
				var calculateRelativeCursorPosition = function(dx, dy, handlePos, center, translate, increment, handleDirection)
				{
					// Mouse position relative to element
					return rotateToElement({ 
						x: handlePos.cx + dx - center.x - (translate.x + increment.x/2),
						y: handlePos.cy + dy - center.y - (translate.y + increment.y/2)
					});
				}
				
				var calculateScale = function(relativeCursorPosition, handleDirection, initialBox)
				{
					// Scale element so that handle is at mouse position
					return {
						x: relativeCursorPosition.x * 2 * handleDirection.x / initialBox.width,
						y: relativeCursorPosition.y * 2 * handleDirection.y / initialBox.height
					}
				}
				
				var rangeLimitDxDy = function(dx, dy, rangeScale, currentWidth, currentHeight, handleDirection) 
				{
					if (!rangeScale) return {
						toCanvas: { x: dx, y: dy},
						toElement: rotateToElement({ x: dx, y: dy})
					} 
					var dxdyToElement = rotateToElement({ x: dx, y: dy});
					var projectedWidth = currentWidth+(dxdyToElement.x * handleDirection.x);
					var projectedHeight = currentHeight+(dxdyToElement.y * handleDirection.y);
					var adjustedWidth = Math.max(Math.min(rangeScale[1], projectedWidth), rangeScale[0]);
					var adjustedHeight = Math.max(Math.min(rangeScale[1], projectedHeight), rangeScale[0]);
					var diffWidth = adjustedWidth - projectedWidth;
					var diffHeight = adjustedHeight - projectedHeight;
					dxdyToElement.x += diffWidth * handleDirection.x;
					dxdyToElement.y += diffHeight * handleDirection.y;
					return {
						toCanvas: rotateToCanvas(dxdyToElement),
						toElement: dxdyToElement
					};
				}
			
                var mouse = d3.mouse(this.ownerSVGElement),
					dx = mouse[0] - start.mouseX, 
					dy = mouse[1] - start.mouseY;

                var rx, ry, rdo, mx, my, sx, sy,
                    handleDirection = {
                        x: parseInt(this.getAttribute('handle-direction-x')),
                        y: parseInt(this.getAttribute('handle-direction-y'))
                    }
					limitedDxDy = rangeLimitDxDy(dx, dy, getProperty(d, 'rangeScale'), d._.initialBorderBox.width * o._.scale.x, d._.initialBorderBox.height * o._.scale.y, handleDirection),
					increment = rotateToCanvas(getElementIncrement(limitedDxDy.toElement, handleDirection)),
					scale = calculateScale(calculateRelativeCursorPosition(limitedDxDy.toCanvas.x, limitedDxDy.toCanvas.y, handlePos, d._.center, o._.translate, increment), handleDirection, d._.initialBorderBox);
		
				d._.translate = { 
                    x: o._.translate.x + increment.x / 2,
                    y: o._.translate.y + increment.y / 2
                };
                d._.scale = {
                    x: scale.x || d._.scale.x,
                    y: scale.y || d._.scale.y
                };	
				
				// Maintain aspect ratio
				if ((this.getAttribute('isCorner') === 'true' && getProperty(d, 'keepRatio').indexOf('c') !== -1) || (this.getAttribute('isCorner') !== 'true' && getProperty(d, 'keepRatio').indexOf('s') !== -1)) {
					if (this.getAttribute('axis') === 'x') {
						d._.scale.y = d._.scale.x / d._.ratio;
					} else {
						d._.scale.x = d._.scale.y * d._.ratio;
					}
					var trans = {
						x: (d._.scale.x - o._.scale.x) * d._.initialBorderBox.width * parseInt(this.getAttribute('handle-direction-x')),
						y: (d._.scale.y - o._.scale.y) * d._.initialBorderBox.height * parseInt(this.getAttribute('handle-direction-y'))
					};
					rx = trans.x * cos + trans.y * sin;
					ry = -trans.x * sin + trans.y * cos;
					d._.translate.x = o._.translate.x + rx / 2;
					d._.translate.y = o._.translate.y + ry / 2;
				}
				d._.ratio = d._.scale.x / d._.scale.y;
                d3.select(this.parentNode).call(applyTransformations);
            });
            return drag;
        })();
		
		/**
         * function: applyLimits
         */
		var applyLimits = function(d) {
			// Snap to angle, rotate with increments
			var snapRotate = getProperty(d, 'snapRotate');
			var snapDistanceRotate = getProperty(d, 'snapDistanceRotate');
			var dist = Math.abs(d._.rotate % snapRotate);
			dist = Math.min(dist, snapRotate - dist);
			if ( dist < snapDistanceRotate ) {
				d._.rotate = Math.round(d._.rotate / snapRotate) * snapRotate;
			}

			// Snap to scale, scale with increments
			var snapScale = getProperty(d, 'snapScale');
			var snapDistanceScale = getProperty(d, 'snapDistanceScale');
			dist = {
					x: Math.abs(( d._.scale.x * d._.initialBorderBox.width ) % snapScale),
					y: Math.abs(( d._.scale.y * d._.initialBorderBox.height ) % snapScale)
				};

			dist = {
					x: Math.min(dist.x, snapScale - dist.x),
					y: Math.min(dist.y, snapScale - dist.y)
				};
			if ( dist.x < snapDistanceScale ) {
				d._.scale.x = Math.round(d._.scale.x * d._.initialBorderBox.width / snapScale) * snapScale / d._.initialBorderBox.width;
			}
			if ( dist.y < snapDistanceScale ) {
				d._.scale.y = Math.round(d._.scale.y * d._.initialBorderBox.height / snapScale) * snapScale / d._.initialBorderBox.height;
			}
			
			// Limit range of rotation
			var rangeRotate = getProperty(d, 'rangeRotate')
			if ( rangeRotate ) {
				var deg = ( 360 + d._.rotate ) % 360;

				if ( deg > 180 ) { deg -= 360; }

				if ( deg < rangeRotate[0] ) { d._.rotate += rangeRotate[0] - deg; }
				if ( deg > rangeRotate[1] ) { d._.rotate += rangeRotate[1] - deg; }
			}
			
			
			// Limit scale
			var rangeScale = getProperty(d, 'rangeScale');
			if ( rangeScale ) {
				if ( d._.scale.x * d._.initialBorderBox.width < rangeScale[0] ) {
					d._.scale.x = rangeScale[0] / d._.initialBorderBox.width;
				}

				if ( d._.scale.y * d._.initialBorderBox.height < rangeScale[0] ) {
					d._.scale.y = rangeScale[0] / d._.initialBorderBox.height;
				}

				if ( d._.scale.x * d._.initialBorderBox.width > rangeScale[1] ) {
					d._.scale.x = rangeScale[1] / d._.initialBorderBox.width;
				}

				if ( d._.scale.y * d._.initialBorderBox.height > rangeScale[1] ) {
					d._.scale.y = rangeScale[1] / d._.initialBorderBox.height;
				}
			}
		};

		/**
         * function: applyTransformations
         */
        var applyTransformations = function() {
            this.attr('transform', function(d) {
                    return 'translate(' + d.x + ' ' + d.y + ')'
                })
                .selectAll('.resize').attr('transform', function(d) {
                    var translate = {
                        x: d._.translate.x,
                        y: d._.translate.y
                    };
                    return ' translate(' + d._.translate.x + ' ' + d._.translate.y + ') rotate(' + d._.rotate + ' ' + d._.center.x + ' ' + d._.center.y + ') translate(' + (-(d._.scale.x - 1) * d._.center.x) + ' ' + (-(d._.scale.y - 1) * d._.center.y) + ') scale(' + d._.scale.x + ' ' + d._.scale.y + ') ';
                });
            this.call(refreshXAxisHandle)
			    .call(refreshYAxisHandle)
			    .call(refreshBorderBox)
                .call(refreshBorderHandles) 
        }
        return my;
    }
    
    // *******************************
    // * Common static functions
    // *******************************
    
    /**
    * Recursive copy of object
    */
    var cloneObj = function(obj) {
            var i, clone = {};   
            for (i in obj) {
                clone[i] = typeof obj[i] === 'object' ? cloneObj(obj[i]) : obj[i];
            }
            return clone;
        },
        parseTransform = function (a) {
            var b={};
            for (var i in a = a.match(/(\w+\((\-?\d+\.?\d*e?\-?\d*,?)+\))+/g))
            {
                var c = a[i].match(/[\w\.\-]+/g);
                b[c.shift()] = c;
            }
            return b;
        },

        lineFunction = d3.svg.line()
                             .x(function(d) { return d.x; })
                             .y(function(d) { return d.y; })
                             .interpolate("linear-closed"),
         
        degreesToRadians = function(degrees) {
             return degrees * Math.PI / 180;
        },
         
        getCenter = function(bbox) {
            return {
                x: bbox.x + bbox.width/2,
                y: bbox.y + bbox.height/2
            }
        },
         
        getCorners = function(center, bbox, rotate, translate, scale) {  
            var width = bbox.width, 
                height = bbox.height;
            var rad = {
                x: degreesToRadians(rotate),
                y: degreesToRadians(rotate + 90)
            };
            var radius = {
                x: width / 2 * scale.x,
                y: height / 2 * scale.y
            };
        
            var corners = [],
                signs = [{
                    x: -1,
                    y: -1
                }, {
                    x: 1,
                    y: -1
                }, {
                    x: 1,
                    y: 1
                }, {
                    x: -1,
                    y: 1
                }];
        
            signs.forEach(function(sign, i) {
                corners.push({
                    x: (center.x + translate.x + sign.x * radius.x * Math.cos(rad.x)) + sign.y * radius.y * Math.cos(rad.y),
                    y: (center.y + translate.y + sign.x * radius.x * Math.sin(rad.x)) + sign.y * radius.y * Math.sin(rad.y)
                });
            });
            return corners;
        };
})();
