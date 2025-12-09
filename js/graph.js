d3.json("js/graph.json").then(function(data) {
    // Canvas size
    height = 1000;
    width = 2000;
    scale = 1.0;
    // Radius function for nodes. Node radius are function of centrality
    radius = d => {
        if (!d.radius) {
            d.radius = 11 + 24 * Math.pow(d.centrality, 9/5);
        }
        return d.radius;
    };
    color = "#ffffff";

    // Number of colors is the number of clusters (given by communityLabel)
    num_colors = Math.max(...data.nodes.map(d => d.communityLabel)) + 1;
    angleArr = [...Array(num_colors).keys()].map(x => 2 * Math.PI * x / num_colors);
    // Cluster centers around an circle
    centersx = angleArr.map(x => Math.cos(Math.PI + x));
    centersy = angleArr.map(x => Math.sin(Math.PI + x));
    // Color palette
    nodeColors = [
        '#E0E0C0',
        '#E0E080',
        '#E0E040',
        '#E0E000',
        '#E0C0C0',
        '#E0C080',
        '#E0C040',
        '#E0C000',
        '#E0A0C0',
        '#E0A080',
        '#E0A040',
        '#E0A000',
        '#E080C0',
        '#E08080',
        '#E08040',
        '#E08000',
        '#E060C0',
        '#E06080',
        '#E06040',
        '#E06000',
        '#E040C0',
        '#E04080',
        '#E04040',
        '#E04000',
        '#E020C0',
        '#E02080',
        '#E02040',
        '#E02000',
        '#E000C0',
        '#E00080',
        '#E00040',
        '#E00000',
        '#C0E0C0',
        '#C0E080',
        '#C0E040',
        '#C0E000',
        '#C0C0C0',
        '#C0C080',
        '#C0C040',
        '#C0C000',
        '#C0A0C0',
        '#C0A080',
        '#C0A040',
        '#C0A000',
        '#C080C0',
        '#C08080',
        '#C08040',
        '#C08000',
        '#C060C0',
        '#C06080',
        '#C06040',
        '#C06000',
        '#C040C0',
        '#C04080',
        '#C04040',
        '#C04000',
        '#C020C0',
        '#C02080',
        '#C02040',
        '#C02000',
        '#C000C0',
        '#C00080',
        '#C00040',
        '#C00000',
        '#A0E0C0',
        '#A0E080',
        '#A0E040',
        '#A0E000',
        '#A0C0C0',
        '#A0C080',
        '#A0C040',
        '#A0C000',
        '#A0A0C0',
        '#A0A080',
        '#A0A040',
        '#A0A000',
        '#A080C0',
        '#A08080',
        '#A08040',
        '#A08000',
        '#A060C0',
        '#A06080',
        '#A06040',
        '#A06000',
        '#A040C0',
        '#A04080',
        '#A04040',
        '#A04000',
        '#A020C0',
        '#A02080',
        '#A02040',
        '#A02000',
        '#A000C0',
        '#A00080',
        '#A00040',
        '#A00000',
        '#80E0C0',
        '#80E080',
        '#80E040',
        '#80E000',
        '#80C0C0',
        '#80C080',
        '#80C040',
        '#80C000',
        '#80A0C0',
        '#80A080',
        '#80A040',
        '#80A000',
        '#8080C0',
        '#808080',
        '#808040',
        '#808000',
        '#8060C0',
        '#806080',
        '#806040',
        '#806000',
        '#8040C0',
        '#804080',
        '#804040',
        '#804000',
        '#8020C0',
        '#802080',
        '#802040',
        '#802000',
        '#8000C0',
        '#800080',
        '#800040',
        '#800000',
        '#60E0C0',
        '#60E080',
        '#60E040',
        '#60E000',
        '#60C0C0',
        '#60C080',
        '#60C040',
        '#60C000',
        '#60A0C0',
        '#60A080',
        '#60A040',
        '#60A000',
        '#6080C0',
        '#608080',
        '#608040',
        '#608000',
        '#6060C0',
        '#606080',
        '#606040',
        '#606000',
        '#6040C0',
        '#604080',
        '#604040',
        '#604000',
        '#6020C0',
        '#602080',
        '#602040',
        '#602000',
        '#6000C0',
        '#600080',
        '#600040',
        '#600000',
        '#40E0C0',
        '#40E080',
        '#40E040',
        '#40E000',
        '#40C0C0',
        '#40C080',
        '#40C040',
        '#40C000',
        '#40A0C0',
        '#40A080',
        '#40A040',
        '#40A000',
        '#4080C0',
        '#408080',
        '#408040',
        '#408000',
        '#4060C0',
        '#406080',
        '#406040',
        '#406000',
        '#4040C0',
        '#404080',
        '#404040',
        '#404000',
        '#4020C0',
        '#402080',
        '#402040',
        '#402000',
        '#4000C0',
        '#400080',
        '#400040',
        '#400000',
        '#20E0C0',
        '#20E080',
        '#20E040',
        '#20E000',
        '#20C0C0',
        '#20C080',
        '#20C040',
        '#20C000',
        '#20A0C0',
        '#20A080',
        '#20A040',
        '#20A000',
        '#2080C0',
        '#208080',
        '#208040',
        '#208000',
        '#2060C0',
        '#206080',
        '#206040',
        '#206000',
        '#2040C0',
        '#204080',
        '#204040',
        '#204000',
        '#2020C0',
        '#202080',
        '#202040',
        '#202000',
        '#2000C0',
        '#200080',
        '#200040',
        '#200000',
        '#00E0C0',
        '#00E080',
        '#00E040',
        '#00E000',
        '#00C0C0',
        '#00C080',
        '#00C040',
        '#00C000',
        '#00A0C0',
        '#00A080',
        '#00A040',
        '#00A000',
        '#0080C0',
        '#008080',
        '#008040',
        '#008000',
        '#0060C0',
        '#006080',
        '#006040',
        '#006000',
        '#0040C0',
        '#004080',
        '#004040',
        '#004000',
        '#0020C0',
        '#002080',
        '#002040',
        '#002000',
        '#0000C0',
        '#000080',
        '#000040',
        '#000000',
    ];
    // Color function just maps cluster to color palette
    nodeColor = d => {
        return nodeColors[d.communityLabel];
    };
    // Make the nodes draggable
    drag = simulation => {
        function dragsubject(event) {
            return simulation.find(event.x, event.y);
        }

        function dragstarted(event) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        function dragended(event) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

        return d3.drag()
                 .subject(dragsubject)
                 .on("start", dragstarted)
                 .on("drag", dragged)
                 .on("end", dragended);
    };
    // Make nodes interactive to hovering
    handleMouseOver = (d, i) => {
        nde = d3.select(d.currentTarget);
        nde.attr("fill", "#999")
           .attr("r", nde.attr("r") * 1.4);

        d3.selectAll("text")
          .filter('#' + CSS.escape(d.currentTarget.id))
          .style("font-size", "2em");

        d3.selectAll("line")
          .attr("stroke-width", 1);

        d3.selectAll("line")
          .filter((l, _) => {
              return l && l.source && l.source.index == i.index || l && l.target && l.target.index == i.index
          })
          .attr("stroke-width", 8);
    };
    handleMouseOut = (d, _) => {
        nde = d3.select(d.currentTarget);
        nde.attr("fill", nodeColor)
           .attr("r", nde.attr("r") / 1.4);

        d3.selectAll("text")
          .filter('#' + CSS.escape(d.currentTarget.id))
          .style("font-size", "1em");

        d3.selectAll("line")
          .attr("stroke-width", 1);
    };

    // Graph data
    const links = data.edges.map(d => Object.create(d));
    const nodes = data.nodes.map(d => Object.create(d));

    // Force simulation for the graph
    simulation = d3.forceSimulation(nodes)
                   .alpha(0.9)
                   .velocityDecay(0.6)
                   .force("link", d3.forceLink(links).id(d => d.id).strength(.1))
                   .force("charge", d3.forceManyBody()
                                      .strength(-500))
                   .force('collision',
                          d3.forceCollide().radius(d => radius(d) * 1.2).strength(1.5))
                   .force('x', d3.forceX().x(function(d) {
                       return width / 2 +  (width / 4) * centersx[d.communityLabel];
                   }).strength(0.25))
                   .force('y', d3.forceY().y(function(d) {
                       return height / 2 +  (height / 8) * centersy[d.communityLabel];
                   }).strength(0.25));

    // Create all the graph elements
    const svg = d3.select("svg")
                  .attr('max-width', '60%')
                  .attr('class', 'node-graph')
                  .attr("viewBox", [0, 0, width, height]);

    const link = svg.append("g")
                    .attr("stroke", "#888")
                    .attr("stroke-opacity", 0.6)
                    .selectAll("line")
                    .data(links)
                    .join("line")
                    .attr("stroke-dasharray", d => (d.predicted? "5,5": "0,0"))
                    .attr("stroke-width", 1);

    const node = svg.append("g")
                    .selectAll("circle")
                    .data(nodes)
                    .join("a")
                    .attr("xlink:href", d => {
                        return "./" + d.lnk;
                    })
                    .attr("id", d => "circle_" + d.lnk)
                    .append("circle")
                    .attr("id", d => d.id.toLowerCase())
                    .attr("r", radius)
                    .attr("fill", nodeColor)
                    .on("mouseover", handleMouseOver)
                    .on("mouseout", handleMouseOut)
                    .call(drag(simulation));

    node.append("title")
        .text(d => d.label.replace(/"/g, ''));

    // Nodes have a label that is visible on hover
    // They have two layers a rectangle "background" and the text on top
    const label = svg.append("g")
                     .selectAll("text")
                     .data(nodes)
                     .join("g");
    const label_background = label.append("text")
                                  .style("font-size", "45px")
                                  .text(function (d) { return "  "+ d.label.replace(/"/g, '') + "  "; })
                                  .attr("dy", -30)
                                  .attr("id", d => d.id.toLowerCase())
                                  .attr("class", "node_label")
                                  .style("display", "none")
                                  .style("pointer-events", "none")
                                  .style("alignment-baseline", "middle")
    // .attr("filter", "url(#solid)");
    const label_text = label.append("text")
                            .style("fill", "#222")
                            .style("font-size", "15px")
                            .text(function (d) { return "  "+ d.label.replace(/"/g, '') + "  "; })
                            .attr("dy", -12)
                            .attr("id", d => d.id.toLowerCase())
                            .attr("class", "node_label")

    // Run the simulation
    simulation.on("tick", () => {
        link.attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node.attr("cx", d => d.x)
            .attr("cy", d => d.y);

        label_text.attr("x", d => d.x)
                  .attr("y", d => d.y);

        label_background.attr("x", d => d.x)
                        .attr("y", d => d.y);
    });
});
