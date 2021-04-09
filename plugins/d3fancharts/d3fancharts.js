/*
 * ////////////////////////////////////////////////////////////////////////////////////////////////////
 * D3 Fan Charts
 * d3fanchart.js 
 * v 1.0.1
 *
 * ////////////////////////////////////////////////////////////////////////////////////////////////////
 * Copyright 2019 Tim Forsythe.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ////////////////////////////////////////////////////////////////////////////////////////////////////
 *
 * This script was developed by Tim Forsythe to create genealogical fan charts displaying the ancestors 
 * of the all individuals in a GEDCOM database, for use with the 
 * Gigatrees genealogy application (http://gigatrees.com, http://gigatrees.appspot.com)
 * The code uses reliability assessments for choosing a node color and translated relationship strings.
 *
 * The script is derived from the Sequences Sunburst by Kerry Rodden at https://bl.ocks.org/kerryrodden/766f8f6d31f645c39f488a0befa1e3c8
 *
 * The code requires the following libraries which are subject to further licence agreements
 *  jQuery 3.4.1 (https://code.jquery.com/jquery-3.4.1.min.js)
 *  D3.v4 (https://d3js.org/d3.v4.min.js)
 *
 * The code expects 4 variables to already be set prior to loading:
 *
 * 		var QUALITY 				: an array of indexes used to select the node color 
 * 		var STRINGS 				: translated strings
 * 		var DATA 					: JSON string formatted as: {"total":n, "data":{"anum":n, "quality":n, "name":"", "collapse":false, "children":[DATA.data]}}
 *
 * The code expects a minimal HTML structure to fill in:
 *
 *		  <div id="d3fanwrapper">
 *		    <div id="d3fanchart">
 *            <div id="description">
 *		        <div id="caption"></div>      
 *			    <ul id="breadcrumbs"></ul>  
 *            </div>
 *          </div> 
 *        </div>
 *
 * ////////////////////////////////////////////////////////////////////////////////////////////////////
*/

		var Strings;
		var WrapperHeight = 0;
		var WindowHeight = 0;
		var WindowWidth = 0;
		
		function getRandomInt(max) {
			return Math.floor(Math.random() * Math.floor(max));
		}
		
		function getColor(d) {
			var color = "";
			
			if (typeof d.quality === "undefined")
			{
				d.quality = getRandomInt(10) + 1; 
			}
			
			switch (d.quality)
			{
				case  0: color = "#d68910"; break; // unsupported
				case  1: color = "#cb4335"; break; // unreliable  
				case  2: color = "#f8c471"; break; // uncertain   
				case  3: color = "#fad7a0"; break; // proposed    
				case  4: color = "#abebc6"; break; // reported    
				case  5: color = "#82e0aa"; break; // supported   
				case  6: color = "#58d68d"; break; // probable    
				case  7: color = "#2ecc71"; break; // certain     
				case  8: color = "#f5b041"; break; // questionable
				case  9: color = "#28b463"; break; // proven      
				case 10: color = "#f39c12"; break; // estimated
				case 11: color = "#b03a2e"; break; // impossible  

				case 8888: color = "#fff"; break; // collapse      	
				
				case 9999:
				default: color = "#eee"; break;	  // missing			
			}
			
			return color;                        
		}
		
		// Gigatrees support translated system text
		function getTranslation(value) {
			var translation = value;
			
			if (typeof Strings !== 'undefined')
			{
				translation = Strings[value];	
			}
			
			return translation;
		}
		
		function getQuality(quality) {
			if (quality == 8888) {
				return getTranslation("Pedigree Collapse")+" : ";
			} else if (quality == 9999) {
				return "";
			} else if (typeof QUALITY !== 'undefined') {
				return QUALITY[quality]+" : ";
			} else {
				return "";
			}
		}

		function ordinal(n) {
			return ["st", "nd", "rd"][((n + 90) % 100 - 10) % 10 - 1] || "th"
		}

		function getGenerationNum(anum) {
			var str = anum.toString(2); // convert to binary
			return str.length;		  	// count bits to derive generation number
		}
		
		function getRelationship(anum) {
			var gn = getGenerationNum(anum) - 3;
			var gp = (anum % 2) ? getTranslation("Grandmother") : getTranslation("Grandfather");
			var ggp = getTranslation("Great")+ " " + gp;
			
			var rel;
			
			     if (anum == 1)	rel = getTranslation("Self");
			else if (anum == 2) rel = getTranslation("Father");
			else if (anum == 3) rel = getTranslation("Mother");
			else if (gn == 0) 	rel = gp;
			else if (gn == 1) 	rel = ggp;
			else 				rel = gn + ordinal(gn) + " " + ggp;
			
			return rel;
		}
		
		function getFather(anum) {
			return parseInt(2 * anum);
		}
		
		function getMother(anum) {
			return getFather(anum) + 1;
		}		

		function getFirstAncestor(node) {
			if (node.children.length > 0)
				return node.children[0];
			return null;	
		}

		function getSecondAncestor(node) {
			if (node.children.length > 1)
				return node.children[1];
			return null;	
		}
		
		function getFirstAncestorNum(node) {
			return getFirstAncestor(node).anum;
		}
		
		function isFemaleAncestor(anum) {
			return ((anum % 2) == 1);
		}

		function addDefaultAncestor(anum, ancestor) {
			ancestor.push({id:"", anum:anum, name:"", quality:9999, collapse:false, childid:"", children:[]}); // 9999 converts to the color white
			return ancestor.slice(-1)[0];
		}

		function addDefaultFather(node) {
			return addDefaultAncestor(getFather(node.anum), node.children);
		}

		function addDefaultMother(node) {
			return addDefaultAncestor(getMother(node.anum), node.children);
		}
		
		function clearAncestors(node) {
			node.children = []; // or = "";
		}
		
		function getNumberOfAncestors(node) {
			return node.children.length;
		}
	
		function buildHeirarchy(node, chartDepth) {
			var fatherNode = null;
			var motherNode = null;
			
			var currentDepth = getGenerationNum(node.anum);
			
			if (currentDepth <= chartDepth) {		
				var numAncestors = getNumberOfAncestors(node);
				if (numAncestors == 0) {

					// add missing ancestors
					fatherNode = addDefaultFather(node);
					motherNode = addDefaultMother(node);
				} else if (numAncestors == 1) { 
					// add missing ancestor
					if (isFemaleAncestor(getFirstAncestorNum(node))) {
						motherNode = getFirstAncestor(node);
						fatherNode = addDefaultFather(node);
					} else {
						fatherNode = getFirstAncestor(node);
						motherNode = addDefaultMother(node);
					}
				} else {
					fatherNode = getFirstAncestor(node);
					motherNode = getSecondAncestor(node);
				}
				
				if (node.collapse) {
					node.quality = 8888;
				}
			
				if ((fatherNode != null) && (node.collapse || fatherNode.collapse)) {
					fatherNode.collapse = true;
					fatherNode.quality = 8888;
				} 
					
				if ((motherNode != null) && (node.collapse || motherNode.collapse)) {
					motherNode.collapse = true;
					motherNode.quality = 8888;
				}
					
				// process their ancestors
				buildHeirarchy(fatherNode, chartDepth); 
				buildHeirarchy(motherNode, chartDepth);
			}
			else {					
				clearAncestors(node); 
			}			
		}
	
		function initCaption(data, pct, chartDepth) {
		
			var caption = d3.select("#caption");
		
			// remove the caption so it doesn't get duplicated in page resize
			caption.selectAll("div").remove();

			// now fill it in
			caption.append("div");
			caption.append("div").attr("class","capname").html(data.name+"");
			if (pct == 0) {
				caption.append("div").attr("class","capnote").html("(" + chartDepth + " " + getTranslation("Generations") + ")");
			} else {
				caption.append("div").attr("class","capnote").html("(" + chartDepth + " " + getTranslation("Generations") + ", " + pct + "% " + getTranslation("Complete") + ")");
			}
		}
		
		function createVisualization(tree, wrapperWidth) {
			var height = window.innerHeight-100; // pad
			var width = wrapperWidth;

			// this trick will align to the top of the screen and create a small pad
			if (height > (.99 * width)) {
				height = .99 * width;
			}
				
			// get the smallest radius
			var radius = Math.min(width, height) / 2;
			// update width based on radius
			width = (2 * radius);

			// Constructs a root node from the specified hierarchical data. and calculate the sums.
			// You must call sum before passing the hierarchy to the partition layout.
			// root.sum() evaluates the specified value function for this node and each descendant in post-order traversal,
			var treeroot = d3.hierarchy(tree).sum(function(d) {return d.children ? ((d.children.length > 0) ? 0 : 1) : 0});

			// Creates a new partition layout 
			var partition = d3.partition().size([Math.PI, radius * radius]); 
			
			// For efficiency, filter nodes to keep only those large enough to see.
			// descendants() returns the array of descendant nodes in topological order.
			var nodeArray = partition(treeroot).descendants().filter(function(d) {return (d.x1 - d.x0 > 0.005);});

			// calculate arc sizes
			var arc = d3.arc()
				.innerRadius(function(d) { return Math.sqrt(d.y0); })
				.outerRadius(function(d) { return Math.sqrt(d.y1); })
				.startAngle(function(d) { return d.x0; })
				.endAngle(function(d) { return d.x1; });
				
			// remove the previous visualization before creating a new one (prevents duplicates)	
		 	d3.select("#d3fanchart > svg").remove(); 
			
			// create the SVG element to hold the visualization, set its height, width and container id and then rotate it into a fan
			vis = d3.select("#d3fanchart")
				.append("svg:svg")
				.attr("width", width)
				.attr("height", height/2) 
				.append("svg:g")
				.attr("id", "container")
				.attr("transform", "translate(" + width / 2 + "," + height / 2 + ") rotate(-90)");

			// Create an invisible bounding circle behind the fanchart, to make it easier to detect when the mouse leaves the parent g.
			vis.append("svg:circle").attr("r", radius).style("opacity", 0);
				
			// Create a new path element for each node in the array and setup the data functions needed to fill in their contents (enter() delivers the data to each element)
			var path = vis.data([tree]).selectAll("path").data(nodeArray).enter().append("svg:path") 
					.attr("display", function(d) {return d.depth ? null : "none"})
					.attr("d", arc)
					.style('stroke', '#fff') // 000 for black
					.attr("fill-rule", "evenodd")
					.style("fill", function(d) { return getColor(d.data); }) 
					.style("opacity", 1)
					.on("mouseover", mouseover)
					.on("click", mouseover); 
			
			// Add the mouseleave handler to the wrapper and bounding circle.
			d3.select("#d3fanwrapper").on("mouseleave", mouseleave);
			d3.select("#container").on("mouseleave", mouseleave);
			
			// center the chart in the window
			var pad = (wrapperWidth - width) / 2;
		 	d3.select("#d3fanchart").style("padding-left", pad+"px"); 
		 	d3.select("#d3fanchart").attr("width", width); 

			$("#description").css("width", width).css("top", height / 2.5); // create offset
			
			// make sure the z-index of the description is -1 and the d3fanchart is > 0 so the description does not block the mouse over detection
			// this is also setup in the stylesheet, but seemed important enough to include here
			$("#description").css("z-index",-1); 
		 	$("#d3fanchart").css("z-index",100); 
			
		}

		function mouseover(e) {

			// build the node array based on the selection
			var nodeArray = e.ancestors().reverse();
			// remove root node (Self) from the array	
			nodeArray.shift(); 

			// Fade all the segments paths.
			d3.selectAll("path").style("opacity", 0.3);
			
		    // Then highlight only those that are an ancestor of the current segment.
			vis.selectAll("path").filter(function(d) {return (nodeArray.indexOf(d) >= 0)}).style("opacity", 1);

		    // Select all the existing breadcrumbs based in their unique id
			var breadcrumbs = d3.select("#breadcrumbs").selectAll("li").data(nodeArray, function(d) {return d.data.anum});
						
			// Remove elements found by filter
			breadcrumbs.exit().remove();

		    // Create a new list element for each breadcrumb in the array and setup the data functions needed to fill in their contents (enter() delivers the data to each element)
			var newbreadcrumbs = breadcrumbs.enter().append("li"); 

			// setup the breadcrumb elements and the data functions to fill in their contents
			var relparent = newbreadcrumbs.append("div").attr("class","relationship");
			relparent.append("span").text("(");
			relparent.append("span").attr("class","quality").html(function(d) {return (getQuality(d.data.quality));});
			relparent.append("span").attr("class","ofkind").html(function(d) {return (getRelationship(d.data.anum));});
			relparent.append("span").text(")");

			newbreadcrumbs.append("div").attr("class","ancestor").attr("style", function(d) {return "color:" +  getColor(d.data)}).html(function(d) {return ((d.data.name ? d.data.name : getTranslation("Missing")));});
						
			d3.select("#breadcrumbs").style("display", "block");				
			
			var pad = 30;
			var breadcrumbsHeight = $("#breadcrumbs").height();
			var h = WrapperHeight+breadcrumbsHeight+pad;

			$("#d3fanwrapper").attr("style","height:"+h+"px");
		}

		function mouseleave(e) {

			$("#d3fanwrapper").attr("style","height:"+WrapperHeight+"px");

			d3.select("#breadcrumbs").style("display", "none"); 
			d3.select("#breadcrumbs").selectAll("li").remove();

			// Deactivate all segments during transition.
			d3.selectAll("path").on("mouseover", null);
								
			// Transition each segment to full opacity and then reactivate it.
			d3.selectAll("path")
				.transition()
				.duration(1000)
				.style("opacity", 1)
				//.on("end", function() {
				//	d3.select(this).on("mouseover", mouseover);
				//})
				;
		}
		
		function calculatePercentComplete(data, depth, size) {
	
			// calculate the expected total ancestors based on the max generation number
			var total = (Math.pow(2, depth+1) - 1) - 1; // subtract 1 for root ancestor
			
			// calculate the percentage based on the adjust total expected ancestors
			return ((size/total)*100).toFixed(2); 
		}

		function rescaleDepth(wrapperWidth) {
			var depth = 9; // D3 appears to limit the max depth to 9
			
			// adjust depth using screen size for dynamic sizing
			if (wrapperWidth < 992) {
				depth = Math.min(depth,8);
				if (wrapperWidth < 768) {
					depth = Math.min(depth,7);
					if (wrapperWidth < 520) {
						depth = Math.min(depth,6);
					}
				} 			
			}

			return depth; 			
		}
		
		// traverse tree recursively counting non-empty ancestors
		function countAncestors(obj) {
			var count = 0;
			
			if((obj !== null) && (typeof obj == "object")) {
				Object.entries(obj).forEach(([key, value]) => {
					if ((key == "id") && (value != "")) {
						count = 1;
					}
					count += countAncestors(value);
				});
			}
			
			return count;
		}

		// traverse tree recursively to find its depth
		function determineDataDepth(obj, depth) {
		
			if((obj !== null) && (typeof obj == "object")) {
				Object.entries(obj).forEach(([key, value]) => {
																		
					if (key == "anum") {
						var currentDepth = getGenerationNum(value);
						if (currentDepth > depth) {
							depth = Math.max(depth,currentDepth);
						}
					}

					depth = determineDataDepth(value,depth);
				});
			}
			
			return depth;
		}
		
		function drawFanChart() {
			
			// make sure we have data and its valid
			if (typeof DATA !== 'undefined') {
				var obj = JSON.parse(JSON.stringify(DATA));			
				if (typeof obj !== null) {
					
					// extract the data from the incoming stream
					var data = obj.data;
				
					// determine the data depth (drop 1st generation)
					var dataDepth = Math.max(determineDataDepth(data, -1) - 1, 0);				

					// get the width of the wrapper so we can scale the chart depth appropriately
					// the wrapper width does not change unless there is a resize event
					var wrapperWidth = $("#d3fanwrapper").width();

					// calculate the maximum chart depth based on the wrapper width
					var chartDepth = Math.min(dataDepth,rescaleDepth(wrapperWidth));

					// finish out the data tree by filling in the gaps based on the scaled size
					buildHeirarchy(data, chartDepth); 
					
					// calculate the number of ancestors in the final data tree (drop 1st generation)
					var size = Math.max(countAncestors(data) - 1, 0);
					
					// calculate the percent complete of the final data tree
					var pct = calculatePercentComplete(data, chartDepth, size);
					
					// create the fan chart
					createVisualization(data, wrapperWidth);
					
					// display the caption
					initCaption(data, pct, chartDepth);		

					// create a pad to display the wrapper element
					// the pad is needed to cover margins and displaying on mobile devices.
					var pad = 90;
					
					// Resize the wrapper to accomodate the ancestor list 
					// and save it globally for use by the mouseover and mouseleave events.
					WrapperHeight = $("#d3fanchart").height()+$("#breadcrumbs").height()+pad;
					$("#d3fanwrapper").attr("style","height:"+WrapperHeight+"px");
				}
			}
		}

		// wait for jQuery and D3 loading (retry every 50mSec)
		(function waitForD3FanChart() {
			if (window.jQuery && window.d3) {

				// Gigatrees supports translated system text
				if (typeof STRINGS !== 'undefined') {
					Strings = JSON.parse(JSON.stringify(STRINGS));
				}
				
				drawFanChart();

				// these variables are made global so thay are available to the asynchronous resize event
				WindowWidth = $("#d3fanwrapper").width();
				WindowHeight = window.innerHeight;
				
				// rebuild the fan chart on resize and orientation change
				$(window).on("resize", function() {
					if (($("#d3fanwrapper").width() != WindowWidth)
						//|| (window.innerHeight != WindowHeight) // enable to rescale on desktop browser window height change
					   ) {
						WindowHeight = window.innerHeight;
						WindowWidth = $("#d3fanwrapper").width();
						drawFanChart();
					}
				}).on("orientationchange", function() {
					drawFanChart();
				});
				
			} else {setTimeout(function() {waitForD3FanChart() }, 50);}
		})();		

