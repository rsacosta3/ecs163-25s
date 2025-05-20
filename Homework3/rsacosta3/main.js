const getDashboardDimensions = () => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    return {
        width: viewportWidth,
        height: viewportHeight,
        margin: {
            top: 20,
            right: 30,
            bottom: 30,
            left: 60
        },
        chartWidth: viewportWidth * 0.95 - 90,
        chartHeight: (viewportHeight * 0.85 - 120) / 3
    };
};

let dimensions = getDashboardDimensions();
let filteredData = null;
let currentTypeFilter = "All";
let pokemonData = null; // Store the loaded data globally

const svg = d3.select("body")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("viewBox", `0 0 ${dimensions.width} ${dimensions.height}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("position", "absolute")
    .style("top", 0)
    .style("left", 0);

// Add dashboard title
svg.append("text")
    .attr("x", dimensions.width / 2)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .attr("font-size", "24px")
    .attr("font-weight", "bold")
    .text("Pokemon Data Dashboard");

const barChartGroup = svg.append("g")
    .attr("class", "bar-chart")
    .attr("transform", `translate(${dimensions.margin.left}, ${dimensions.margin.top + 40})`);

const quadrantChartGroup = svg.append("g")
    .attr("class", "quadrant-chart")
    .attr("transform", `translate(${dimensions.margin.left}, ${dimensions.margin.top + dimensions.chartHeight + 120})`);

const parallelChartGroup = svg.append("g")
    .attr("class", "parallel-chart")
    .attr("transform", `translate(${dimensions.margin.left}, ${dimensions.margin.top + dimensions.chartHeight * 2 + 230})`);

const typeColors = {
    "Water": "#1f77b4",
    "Normal": "#d3d3d3",
    "Flying": "#add8e6",
    "Grass": "#2ca02c",
    "Psychic": "#800080",
    "Bug": "#ff0000",
    "Ground": "#8b4513",
    "Poison": "#006400",
    "Fire": "#ff7f0e",
    "Rock": "#808080",
    "Dark": "#000000",
    "Fighting": "#800000",
    "Electric": "#ffd700",
    "Steel": "#a9a9a9",
    "Dragon": "#ff8c00",
    "Fairy": "#ffb6c1",
    "Ghost": "#c0c0c0",
    "Ice": "#b0e0e6"
};

const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background-color", "#f9f9f9")
    .style("padding", "10px")
    .style("border", "1px solid #ccc")
    .style("border-radius", "5px")
    .style("box-shadow", "0px 0px 6px rgba(0,0,0,0.2)")
    .style("font-size", "12px")
    .style("pointer-events", "none")
    .style("opacity", 0)
    .style("z-index", "10000");

// 1. Enhanced Bar Chart with Animation
// Function to create a bar chart where bars grow from the base and axes appear with transitions
function createBarChart(data) {
    const typeCounts = {};
    data.forEach(d => {
        const type = d.Type_1;
        if (type) {
            typeCounts[type] = (typeCounts[type] || 0) + 1;
        }
    });

    const typeData = Object.entries(typeCounts)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count);

    barChartGroup.append("text")
        .attr("class", "chart-title")
        .attr("x", dimensions.chartWidth / 2)
        .attr("y", -5)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .attr("font-weight", "bold")
        .text("Overview of Pokemon by Primary Type");

    const x = d3.scaleBand()
        .domain(typeData.map(d => d.type))
        .range([0, dimensions.chartWidth])
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain([0, d3.max(typeData, d => d.count) * 1.1])
        .range([dimensions.chartHeight - 40, 0]);

    // Animate the axes
    barChartGroup.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${dimensions.chartHeight - 40})`)
        .transition()
        .duration(1000)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-30)")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .style("font-size", "10px");

    barChartGroup.append("g")
        .attr("class", "y-axis")
        .transition()
        .duration(1000)
        .call(d3.axisLeft(y));

    barChartGroup.append("text")
        .attr("class", "x-label")
        .attr("x", dimensions.chartWidth / 2)
        .attr("y", dimensions.chartHeight - 0)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .text("Pokemon Type");

    barChartGroup.append("text")
        .attr("class", "y-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -(dimensions.chartHeight - 40) / 2)
        .attr("y", -40)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .text("Number of Pokemon");

    // Animate the bars
    barChartGroup.selectAll(".bar")
        .data(typeData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.type))
        .attr("y", dimensions.chartHeight - 40)
        .attr("width", x.bandwidth())
        .attr("height", 0)
        .attr("fill", d => typeColors[d.type] || "#ccc")
        .on("mouseover", function(d) {
            d3.select(this).attr("opacity", 0.8);
            tooltip.transition()
                .duration(200)
                .style("opacity", 0.9);
            tooltip.html(`<strong>${d.type}</strong><br/>Count: ${d.count}`)
                .style("left", (d3.event.pageX + 10) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            d3.select(this).attr("opacity", 1);
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        })
        .transition()
        .duration(1000)
        .attr("y", d => y(d.count))
        .attr("height", d => dimensions.chartHeight - 40 - y(d.count));
}

// 2. Enhanced Quadrant Chart with Filtering and Brushing
function createQuadrantChart(data) {
    data.forEach(d => {
        d.Total = +d.Total;
        d.Catch_Rate = +d.Catch_Rate;
    });

    quadrantChartGroup.append("text")
        .attr("class", "chart-title")
        .attr("x", dimensions.chartWidth / 2)
        .attr("y", -5)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .attr("font-weight", "bold")
        .text("Pokemon Quadrant Analysis: Total Stats vs Catch Rate");

    // Add filter dropdown
    const filterTypes = ["All", ...new Set(data.map(d => d.Type_1))].sort();
    const filter = quadrantChartGroup.append("foreignObject")
        .attr("x", 10)
        .attr("y", -25)
        .attr("width", 200)
        .attr("height", 30)
        .append("xhtml:select")
        .attr("id", "type-filter")
        .style("width", "150px")
        .style("padding", "3px")
        .on("change", function() {
            currentTypeFilter = this.value;
            updateQuadrantChart(data);
        });

    filter.selectAll("option")
        .data(filterTypes)
        .enter()
        .append("option")
        .attr("value", d => d)
        .text(d => d);

    // Initial chart creation
    updateQuadrantChart(data);
}

// Function to update the quadrant chart with filtering and brushing, and animate quadrant area fades
function updateQuadrantChart(data) {
    // Filter data based on selection
    const filteredData = currentTypeFilter === "All" ?
        data :
        data.filter(d => d.Type_1 === currentTypeFilter);

    // Clear previous elements except title and filter
    quadrantChartGroup.selectAll(".x-axis").remove();
    quadrantChartGroup.selectAll(".y-axis").remove();
    quadrantChartGroup.selectAll(".point").remove();
    quadrantChartGroup.selectAll(".median-line").remove();
    quadrantChartGroup.selectAll(".quadrant").remove();
    quadrantChartGroup.selectAll(".legend").remove();

    // Create scales
    const xScale = d3.scaleLinear()
        .domain([d3.min(data, d => d.Total) * 0.9, d3.max(data, d => d.Total) * 1.05])
        .range([0, dimensions.chartWidth]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.Catch_Rate) * 1.05])
        .range([dimensions.chartHeight - 40, 0]);

    // Calculate medians
    const medianTotal = d3.median(filteredData, d => d.Total);
    const medianCatchRate = d3.median(filteredData, d => d.Catch_Rate);

    // Draw background quadrants with animation
    const quadrantColors = {
        "topleft": "#a8a8d8",
        "topright": "#a8d8a8",
        "bottomleft": "#d8d8a8",
        "bottomright": "#d8a8a8"
    };

    quadrantChartGroup.append("rect")
        .attr("class", "quadrant")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", xScale(medianTotal))
        .attr("height", yScale(medianCatchRate))
        .attr("fill", quadrantColors.topleft)
        .attr("opacity", 0)
        .transition()
        .duration(500)
        .attr("opacity", 0.2);

    quadrantChartGroup.append("rect")
        .attr("class", "quadrant")
        .attr("x", xScale(medianTotal))
        .attr("y", 0)
        .attr("width", dimensions.chartWidth - xScale(medianTotal))
        .attr("height", yScale(medianCatchRate))
        .attr("fill", quadrantColors.topright)
        .attr("opacity", 0)
        .transition()
        .duration(500)
        .attr("opacity", 0.2);

    quadrantChartGroup.append("rect")
        .attr("class", "quadrant")
        .attr("x", 0)
        .attr("y", yScale(medianCatchRate))
        .attr("width", xScale(medianTotal))
        .attr("height", dimensions.chartHeight - 40 - yScale(medianCatchRate))
        .attr("fill", quadrantColors.bottomleft)
        .attr("opacity", 0)
        .transition()
        .duration(500)
        .attr("opacity", 0.2);

    quadrantChartGroup.append("rect")
        .attr("class", "quadrant")
        .attr("x", xScale(medianTotal))
        .attr("y", yScale(medianCatchRate))
        .attr("width", dimensions.chartWidth - xScale(medianTotal))
        .attr("height", dimensions.chartHeight - 40 - yScale(medianCatchRate))
        .attr("fill", quadrantColors.bottomright)
        .attr("opacity", 0)
        .transition()
        .duration(500)
        .attr("opacity", 0.2);

    // Create axes
    quadrantChartGroup.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${dimensions.chartHeight - 40})`)
        .call(d3.axisBottom(xScale));

    quadrantChartGroup.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(yScale));

    // Add axis labels
    quadrantChartGroup.append("text")
        .attr("class", "x-label")
        .attr("x", dimensions.chartWidth / 2)
        .attr("y", dimensions.chartHeight - 5)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .text("Total Stats");

    quadrantChartGroup.append("text")
        .attr("class", "y-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -(dimensions.chartHeight - 40) / 2)
        .attr("y", -40)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .text("Catch Rate (Higher = Easier to Catch)");

    // Draw median lines
    quadrantChartGroup.append("line")
        .attr("class", "median-line")
        .attr("x1", xScale(medianTotal))
        .attr("y1", 0)
        .attr("x2", xScale(medianTotal))
        .attr("y2", dimensions.chartHeight - 40)
        .attr("stroke", "black")
        .attr("stroke-dasharray", "4")
        .attr("stroke-width", 1);

    quadrantChartGroup.append("line")
        .attr("class", "median-line")
        .attr("x1", 0)
        .attr("y1", yScale(medianCatchRate))
        .attr("x2", dimensions.chartWidth)
        .attr("y2", yScale(medianCatchRate))
        .attr("stroke", "black")
        .attr("stroke-dasharray", "4")
        .attr("stroke-width", 1);

    // Create scatter points with brushing
    const brush = d3.brush()
        .extent([[0, 0], [dimensions.chartWidth, dimensions.chartHeight - 40]])
        .on("end", brushed);

    quadrantChartGroup.append("g")
        .attr("class", "brush")
        .call(brush);

    const points = quadrantChartGroup.selectAll(".point")
        .data(filteredData)
        .enter()
        .append("circle")
        .attr("class", "point")
        .attr("cx", d => xScale(d.Total))
        .attr("cy", d => yScale(d.Catch_Rate))
        .attr("r", 3)
        .attr("fill", d => typeColors[d.Type_1] || "#ccc")
        .attr("stroke", "black")
        .attr("stroke-width", 0.5)
        .attr("opacity", 0.7)
        .on("mouseover", function(d) {
            d3.select(this)
                .attr("r", 6)
                .attr("stroke-width", 1.5);

            tooltip.transition()
                .duration(200)
                .style("opacity", 0.9);
            tooltip.html(`
                <strong>${d.Name}</strong><br/>
                Type: ${d.Type_1}<br/>
                Total Strength: ${d.Total}<br/>
                Catch Rate: ${d.Catch_Rate}
            `)
                .style("left", (d3.event.pageX + 10) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            d3.select(this)
                .attr("r", 3)
                .attr("stroke-width", 0.5);

            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

    // Add legend
    const legendData = [
        { label: "Strong & Easy to Catch", color: quadrantColors.topright },
        { label: "Weak & Easy to Catch", color: quadrantColors.topleft },
        { label: "Strong & Hard to Catch", color: quadrantColors.bottomright },
        { label: "Weak & Hard to Catch", color: quadrantColors.bottomleft }
    ];

    const legend = quadrantChartGroup.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${dimensions.chartWidth - 180}, 10)`);

    legend.selectAll(".legend-item")
        .data(legendData)
        .enter()
        .append("g")
        .attr("class", "legend-item")
        .attr("transform", (d, i) => `translate(0, ${i * 15})`)
        .each(function(d, i) {
            d3.select(this)
                .append("rect")
                .attr("width", 10)
                .attr("height", 10)
                .attr("fill", d.color)
                .attr("opacity", 0.7);

            d3.select(this)
                .append("text")
                .attr("x", 15)
                .attr("y", 8)
                .attr("font-size", "8px")
                .text(d.label);
        });

    // Brushing function
    function brushed() {
        const selection = d3.event.selection;
        if (!selection) return;

        const [[x0, y0], [x1, y1]] = selection;
        const selectedPoints = filteredData.filter(d => {
            const xPos = xScale(d.Total);
            const yPos = yScale(d.Catch_Rate);
            return xPos >= x0 && xPos <= x1 && yPos >= y0 && yPos <= y1;
        });

        // Store filtered data for other charts
        filteredData = selectedPoints;

        // Highlight selected points
        quadrantChartGroup.selectAll(".point")
            .attr("opacity", d =>
                selectedPoints.includes(d) ? 1 : 0.1);
    }
}

// 3. Enhanced Parallel Coordinates Chart with Type Selection and Line Drawing Animation
// Function to create a parallel coordinates chart with animated lines representing average stats per type
function createParallelCoordinatesChart(data) {
    const numericColumns = ["HP", "Attack", "Defense", "Sp_Atk", "Sp_Def", "Speed"];
    data.forEach(d => {
        numericColumns.forEach(col => {
            d[col] = +d[col];
        });
    });

    // Calculate type averages
    const typeGroups = d3.nest()
        .key(d => d.Type_1)
        .entries(data);

    const typeAverages = typeGroups.map(group => {
        const avgStats = {
            Type_1: group.key,
            count: group.values.length
        };

        numericColumns.forEach(stat => {
            avgStats[stat] = d3.mean(group.values, d => d[stat]);
        });

        return avgStats;
    });

    parallelChartGroup.selectAll("*").remove();

    parallelChartGroup.append("text")
        .attr("class", "chart-title")
        .attr("x", dimensions.chartWidth / 2)
        .attr("y", -60)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .attr("font-weight", "bold")
        .text("Pokemon Stats by Primary Type");

    parallelChartGroup.append("text")
        .attr("class", "chart-subtitle")
        .attr("x", dimensions.chartWidth / 2)
        .attr("y", -45)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("font-style", "bold")
        .text("Click on a Type to Explore its Pokemon");

    // Create horizontal legend
    const topTypes = typeAverages
        .sort((a, b) => b.count - a.count)
        .slice(0, 14);

    let currentX = dimensions.chartWidth/2 - (topTypes.length * 60)/2;
    const miniLegend = parallelChartGroup.append("g")
        .attr("class", "mini-legend")
        .attr("transform", `translate(0, -30)`);

    const legendItems = miniLegend.selectAll(".legend-item")
        .data(topTypes)
        .enter()
        .append("g")
        .attr("class", "legend-item")
        .attr("transform", (d, i) => {
            const xPos = currentX;
            currentX += 60;
            return `translate(${xPos}, 0)`;
        });

    legendItems.each(function(d) {
        const item = d3.select(this);
        item.append("line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", 20)
            .attr("y2", 0)
            .attr("stroke", typeColors[d.Type_1] || "#ccc")
            .attr("stroke-width", 2)
            .on("click", function() {
                showIndividualPokemon(data, d.Type_1);
            });

        item.append("text")
            .attr("x", 25)
            .attr("y", 4)
            .attr("font-size", "10px")
            .text(d.Type_1)
            .on("click", function() {
                showIndividualPokemon(data, d.Type_1);
            });
    });

    // Create scales
    const x = d3.scalePoint()
        .range([0, dimensions.chartWidth])
        .domain(numericColumns)
        .padding(0.5);

    const y = {};
    numericColumns.forEach(dim => {
        y[dim] = d3.scaleLinear()
            .domain([
                d3.min(typeAverages, d => d[dim]) * 0.9,
                d3.max(typeAverages, d => d[dim]) * 1.05
            ])
            .range([dimensions.chartHeight - 40, 0]);
    });

    // Create axis
    const axes = parallelChartGroup.selectAll(".dimension")
        .data(numericColumns)
        .enter()
        .append("g")
        .attr("class", "dimension")
        .attr("transform", d => `translate(${x(d)}, 0)`);

    axes.append("g")
        .each(function(d) {
            d3.select(this).call(d3.axisLeft().scale(y[d]).ticks(5));
        });

    axes.append("text")
        .attr("y", -9)
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .text(d => d);

    // Create line generator
    const line = d3.line()
        .defined(d => d !== null)
        .x(d => d.x)
        .y(d => d.y);

    // Function to animate line drawing
    function animateLine(path, duration = 1000) {
        const totalLength = path.node().getTotalLength();

        path.attr("stroke-dasharray", totalLength + " " + totalLength)
            .attr("stroke-dashoffset", totalLength)
            .transition()
            .duration(duration)
            .ease(d3.easeLinear)
            .attr("stroke-dashoffset", 0);
    }

    // Draw lines for each type with animation
    const typeLines = parallelChartGroup.selectAll(".type-line")
        .data(typeAverages)
        .enter()
        .append("path")
        .attr("class", "type-line")
        .attr("d", d => {
            return line(numericColumns.map(dim => {
                return {
                    x: x(dim),
                    y: y[dim](d[dim])
                };
            }));
        })
        .attr("fill", "none")
        .attr("stroke", d => typeColors[d.Type_1] || "#ccc")
        .attr("stroke-width", 2)
        .attr("opacity", 0.7)
        .on("mouseover", function(d) {
            d3.select(this)
                .attr("stroke-width", 4)
                .attr("opacity", 1)
                .raise();

            tooltip.transition()
                .duration(200)
                .style("opacity", 0.9);
            tooltip.html(`
                <strong>${d.Type_1} Type (${d.count} Pokémon)</strong><br/>
                <hr/>
                ${numericColumns.map(stat => `${stat}: ${d[stat].toFixed(1)}`).join("<br/>")}
            `)
                .style("left", (d3.event.pageX + 10) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            d3.select(this)
                .attr("stroke-width", 2)
                .attr("opacity", 0.7);
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        })
        .on("click", function(d) {
            showIndividualPokemon(data, d.Type_1);
        });

    // Animate each line with a staggered delay
    typeLines.each(function(d, i) {
        d3.select(this).call(animateLine, 1000, i * 100);
    });
}

// Function to show individual Pokemon stats as animated lines for each Pokemon of a selected type
function showIndividualPokemon(data, type) {
    // Filter data for the selected type
    const typePokemon = data.filter(d => d.Type_1 === type);

    // Clear previous parallel chart
    parallelChartGroup.selectAll("*").remove();

    // Add title
    parallelChartGroup.append("text")
        .attr("class", "chart-title")
        .attr("x", dimensions.chartWidth / 2)
        .attr("y", -45)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .attr("font-weight", "bold")
        .text(`Individual ${type} Type Pokémon Stats`);

    // Add back button
    const backButton = parallelChartGroup.append("g")
        .attr("class", "back-button")
        .attr("transform", `translate(10, -30)`)
        .style("cursor", "pointer");

    backButton.append("rect")
        .attr("width", 80)
        .attr("height", 11)
        .attr("fill", "#f0f0f0")
        .attr("stroke", "#999")
        .attr("rx", 5);

    backButton.append("text")
        .attr("x", 40)
        .attr("y", 9.5)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .text("← Back");

    backButton.on("click", function() {
        // Recreate the original parallel coordinates chart
        parallelChartGroup.selectAll("*").remove();
        createParallelCoordinatesChart(pokemonData);
    });

    const numericColumns = ["HP", "Attack", "Defense", "Sp_Atk", "Sp_Def", "Speed"];

    // Create scales
    const x = d3.scalePoint()
        .range([0, dimensions.chartWidth])
        .domain(numericColumns)
        .padding(0.5);

    const y = {};
    numericColumns.forEach(dim => {
        y[dim] = d3.scaleLinear()
            .domain([
                d3.min(typePokemon, d => +d[dim]) * 0.9,
                d3.max(typePokemon, d => +d[dim]) * 1.05
            ])
            .range([dimensions.chartHeight - 40, 0]);
    });

    // Create axis
    const axes = parallelChartGroup.selectAll(".dimension")
        .data(numericColumns)
        .enter()
        .append("g")
        .attr("class", "dimension")
        .attr("transform", d => `translate(${x(d)}, 0)`);

    axes.append("g")
        .each(function(d) {
            d3.select(this).call(d3.axisLeft().scale(y[d]).ticks(5));
        });

    axes.append("text")
        .attr("y", -9)
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .text(d => d);

    // Create line generator
    const line = d3.line()
        .defined(d => d !== null)
        .x(d => d.x)
        .y(d => d.y);

    // Function to animate line drawing
    function animateLine(path, duration = 800, delay = 0) {
        const totalLength = path.node().getTotalLength();

        path.attr("stroke-dasharray", totalLength + " " + totalLength)
            .attr("stroke-dashoffset", totalLength)
            .transition()
            .delay(delay)
            .duration(duration)
            .ease(d3.easeLinear)
            .attr("stroke-dashoffset", 0);
    }

    // Draw lines for each Pokemon with animation
    const pokemonLines = parallelChartGroup.selectAll(".pokemon-line")
        .data(typePokemon)
        .enter()
        .append("path")
        .attr("class", "pokemon-line")
        .attr("d", d => {
            return line(numericColumns.map(dim => {
                return {
                    x: x(dim),
                    y: y[dim](d[dim])
                };
            }));
        })
        .attr("fill", "none")
        .attr("stroke", typeColors[type] || "#ccc")
        .attr("stroke-width", 1)
        .attr("opacity", 0.7)
        .on("mouseover", function(d) {
            d3.select(this)
                .attr("stroke-width", 3)
                .attr("opacity", 1)
                .raise();

            tooltip.transition()
                .duration(200)
                .style("opacity", 0.9);
            tooltip.html(`
                <strong>${d.Name}</strong><br/>
                Type: ${d.Type_1}${d.Type_2 ? "/" + d.Type_2 : ""}<br/>
                <hr/>
                ${numericColumns.map(stat => `${stat}: ${d[stat]}`).join("<br/>")}
            `)
                .style("left", (d3.event.pageX + 10) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            d3.select(this)
                .attr("stroke-width", 1)
                .attr("opacity", 0.7);
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

    // Animate each Pokemon line with staggered delay
    pokemonLines.each(function(d, i) {
        d3.select(this).call(animateLine, 800, i * 20);
    });

    // Add count of displayed Pokemon
    parallelChartGroup.append("text")
        .attr("x", dimensions.chartWidth - 10)
        .attr("y", -25)
        .attr("text-anchor", "end")
        .attr("font-size", "12px")
        .text(`Showing ${typePokemon.length} ${type} Pokémon`);
}

// Load data and create charts
d3.csv("pokemon.csv").then(function(data) {
    pokemonData = data; // Store the data globally
    createBarChart(data);
    createQuadrantChart(data);
    createParallelCoordinatesChart(data);
});

// Handle window resize
window.addEventListener('resize', function() {
    dimensions = getDashboardDimensions();
    svg.attr("viewBox", `0 0 ${dimensions.width} ${dimensions.height}`);
    svg.select("text").attr("x", dimensions.width / 2);

    svg.select(".bar-chart")
        .attr("transform", `translate(${dimensions.margin.left}, ${dimensions.margin.top + 40})`);

    svg.select(".quadrant-chart")
        .attr("transform", `translate(${dimensions.margin.left}, ${dimensions.margin.top + dimensions.chartHeight + 120})`);

    svg.select(".parallel-chart")
        .attr("transform", `translate(${dimensions.margin.left}, ${dimensions.margin.top + dimensions.chartHeight * 2 + 230})`);

    // Only recreate charts if data is loaded
    if (pokemonData) {
        barChartGroup.selectAll("*").remove();
        quadrantChartGroup.selectAll("*").remove();
        parallelChartGroup.selectAll("*").remove();

        createBarChart(pokemonData);
        createQuadrantChart(pokemonData);
        createParallelCoordinatesChart(pokemonData);
    }
});