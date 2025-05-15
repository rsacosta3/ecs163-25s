const getDashboardDimensions = () => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate dimensions for the dashboard and charts
    return {
        width: viewportWidth,
        height: viewportHeight,
        margin: {
            top: 20,
            right: 30,
            bottom: 30,
            left: 60
        },
        chartWidth: viewportWidth * 0.95 - 90, // 90 for margins
        chartHeight: (viewportHeight * 0.85 - 120) / 3 // Reduced height multiplier to fit all charts
    };
};

// Get initial dimensions
let dimensions = getDashboardDimensions();

// Create SVG container that fills the viewport using D3
const svg = d3.select("body")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("viewBox", `0 0 ${dimensions.width} ${dimensions.height}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("position", "absolute")
    .style("top", 0)
    .style("left", 0);

// Add dashboard title using D3 text element
svg.append("text")
    .attr("x", dimensions.width / 2)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .attr("font-size", "24px")
    .attr("font-weight", "bold")
    .text("Pokemon Data Dashboard");

// Create groups for each chart with proper positioning using D3
const barChartGroup = svg.append("g")
    .attr("class", "bar-chart")
    .attr("transform", `translate(${dimensions.margin.left}, ${dimensions.margin.top + 40})`);

const quadrantChartGroup = svg.append("g")
    .attr("class", "quadrant-chart")
    .attr("transform", `translate(${dimensions.margin.left}, ${dimensions.margin.top + dimensions.chartHeight + 120})`); // Reduced vertical spacing

const parallelChartGroup = svg.append("g")
    .attr("class", "parallel-chart")
    .attr("transform", `translate(${dimensions.margin.left}, ${dimensions.margin.top + dimensions.chartHeight * 2 + 230})`); // Reduced vertical spacing

// Define the type colors to be used in all charts
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

// Create tooltip div using D3 for hover interactions
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

// Creates a bar chart showing Pokemon counts by type using D3
function createBarChart(data) {
    // Calculate type counts
    const typeCounts = {};
    data.forEach(d => {
        const type = d.Type_1;
        if (type) {
            typeCounts[type] = (typeCounts[type] || 0) + 1;
        }
    });

    const typeData = Object.entries(typeCounts)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count); // Sort by count descending

    // Add chart title using D3
    barChartGroup.append("text")
        .attr("class", "chart-title")
        .attr("x", dimensions.chartWidth / 2)
        .attr("y", -5)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .attr("font-weight", "bold")
        .text("Overview of Pokemon by Primary Type");

    // Create scales using D3
    const x = d3.scaleBand()
        .domain(typeData.map(d => d.type))
        .range([0, dimensions.chartWidth])
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain([0, d3.max(typeData, d => d.count) * 1.1])
        .range([dimensions.chartHeight - 40, 0]);

    // Create axes using D3
    barChartGroup.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${dimensions.chartHeight - 40})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-30)")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .style("font-size", "10px");

    barChartGroup.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y));

    // Add axis labels using D3
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

    // Create bars using D3 data binding
    barChartGroup.selectAll(".bar")
        .data(typeData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.type))
        .attr("y", d => y(d.count))
        .attr("width", x.bandwidth())
        .attr("height", d => dimensions.chartHeight - 40 - y(d.count))
        .attr("fill", d => typeColors[d.type] || "#ccc")
        .on("mouseover", function(d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", 0.9);
            tooltip.html(`<strong>${d.type}</strong><br/>Count: ${d.count}`)
                .style("left", (d3.event.pageX + 10) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });
}

// Creates a quadrant chart comparing Total Stats vs Catch Rate using D3
function createQuadrantChart(data) {
    // Process data
    data.forEach(d => {
        d.Total = +d.Total;
        d.Catch_Rate = +d.Catch_Rate;
    });

    // Add chart title using D3
    quadrantChartGroup.append("text")
        .attr("class", "chart-title")
        .attr("x", dimensions.chartWidth / 2)
        .attr("y", -5)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .attr("font-weight", "bold")
        .text("Pokémon Quadrant Analysis: Total Stats vs Catch Rate");

    // Create scales using D3
    const xScale = d3.scaleLinear()
        .domain([d3.min(data, d => d.Total) * 0.9, d3.max(data, d => d.Total) * 1.05])
        .range([0, dimensions.chartWidth]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.Catch_Rate) * 1.05])
        .range([dimensions.chartHeight - 40, 0]);

    // Calculate medians for quadrants
    const medianTotal = d3.median(data, d => d.Total);
    const medianCatchRate = d3.median(data, d => d.Catch_Rate);

    // Define quadrant colors
    const quadrantColors = {
        "topleft": "#a8a8d8",
        "topright": "#a8d8a8",
        "bottomleft": "#d8d8a8",
        "bottomright": "#d8a8a8"
    };

    // Draw background quadrants using D3
    quadrantChartGroup.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", xScale(medianTotal))
        .attr("height", yScale(medianCatchRate))
        .attr("fill", quadrantColors.topleft)
        .attr("opacity", 0.2);

    quadrantChartGroup.append("rect")
        .attr("x", xScale(medianTotal))
        .attr("y", 0)
        .attr("width", dimensions.chartWidth - xScale(medianTotal))
        .attr("height", yScale(medianCatchRate))
        .attr("fill", quadrantColors.topright)
        .attr("opacity", 0.2);

    quadrantChartGroup.append("rect")
        .attr("x", 0)
        .attr("y", yScale(medianCatchRate))
        .attr("width", xScale(medianTotal))
        .attr("height", dimensions.chartHeight - 40 - yScale(medianCatchRate))
        .attr("fill", quadrantColors.bottomleft)
        .attr("opacity", 0.2);

    quadrantChartGroup.append("rect")
        .attr("x", xScale(medianTotal))
        .attr("y", yScale(medianCatchRate))
        .attr("width", dimensions.chartWidth - xScale(medianTotal))
        .attr("height", dimensions.chartHeight - 40 - yScale(medianCatchRate))
        .attr("fill", quadrantColors.bottomright)
        .attr("opacity", 0.2);

    // Create axes using D3
    quadrantChartGroup.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${dimensions.chartHeight - 40})`)
        .call(d3.axisBottom(xScale));

    quadrantChartGroup.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(yScale));

    // Add axis labels using D3
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

    // Draw median lines using D3
    quadrantChartGroup.append("line")
        .attr("x1", xScale(medianTotal))
        .attr("y1", 0)
        .attr("x2", xScale(medianTotal))
        .attr("y2", dimensions.chartHeight - 40)
        .attr("stroke", "black")
        .attr("stroke-dasharray", "4")
        .attr("stroke-width", 1);

    quadrantChartGroup.append("line")
        .attr("x1", 0)
        .attr("y1", yScale(medianCatchRate))
        .attr("x2", dimensions.chartWidth)
        .attr("y2", yScale(medianCatchRate))
        .attr("stroke", "black")
        .attr("stroke-dasharray", "4")
        .attr("stroke-width", 1);

    // Create scatter points using D3 data binding
    quadrantChartGroup.selectAll(".point")
        .data(data)
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

    // Add compact legend for quadrants using D3
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
}

// Creates a parallel coordinates chart comparing stats by type using D3
function createParallelCoordinatesChart(data) {
    // Convert numeric columns
    const numericColumns = ["HP", "Attack", "Defense", "Sp_Atk", "Sp_Def", "Speed"];
    data.forEach(d => {
        numericColumns.forEach(col => {
            d[col] = +d[col];
        });
    });

    // Calculate type averages using D3 nest
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

    // Add chart title using D3
    parallelChartGroup.append("text")
        .attr("class", "chart-title")
        .attr("x", dimensions.chartWidth / 2)
        .attr("y", -45)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .attr("font-weight", "bold")
        .text("Average Pokémon Stats by Primary Type");

    // Create horizontal legend between title and chart using D3
    const topTypes = typeAverages
        .sort((a, b) => b.count - a.count)
        .slice(0, 14); // Show all types (or adjust number as needed)

    // Calculate dynamic spacing based on type name length
    const typeWidths = topTypes.map(d => d.Type_1.length * 6 + 30); // Approximate width needed per type
    const totalWidth = d3.sum(typeWidths);
    let currentX = dimensions.chartWidth/2 - totalWidth/2; // Start position for first legend item

    const miniLegend = parallelChartGroup.append("g")
        .attr("class", "mini-legend")
        .attr("transform", `translate(0, -30)`); // Vertical position only

    // Create legend items with dynamic spacing using D3
    const legendItems = miniLegend.selectAll(".legend-item")
        .data(topTypes)
        .enter()
        .append("g")
        .attr("class", "legend-item")
        .attr("transform", (d, i) => {
            const xPos = currentX;
            currentX += typeWidths[i]; // Move position for next item
            return `translate(${xPos}, 0)`;
        });

    // Add colored line and type name to each legend item using D3
    legendItems.each(function(d) {
        const item = d3.select(this);

        // Add colored line
        item.append("line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", 20)
            .attr("y2", 0)
            .attr("stroke", typeColors[d.Type_1] || "#ccc")
            .attr("stroke-width", 2);

        // Add type name with padding
        item.append("text")
            .attr("x", 25)
            .attr("y", 4)
            .attr("font-size", "10px")
            .text(d.Type_1);
    });

    // Create scales for each dimension using D3
    const x = d3.scalePoint()
        .range([0, dimensions.chartWidth])
        .domain(numericColumns);

    const y = {};
    numericColumns.forEach(dim => {
        y[dim] = d3.scaleLinear()
            .domain([
                d3.min(typeAverages, d => d[dim]) * 0.9,
                d3.max(typeAverages, d => d[dim]) * 1.05
            ])
            .range([dimensions.chartHeight - 40, 0]);
    });

    // Create axis for each dimension using D3
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

    // Add axis labels using D3
    axes.append("text")
        .attr("y", -9)
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .text(d => d);

    // Create line generator using D3
    const line = d3.line()
        .defined(d => d !== null)
        .x(d => d.x)
        .y(d => d.y);

    // Draw lines for each type using D3 data binding
    parallelChartGroup.selectAll(".type-line")
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
        });
}

// Load data and create charts using D3
d3.csv("pokemon.csv").then(function(data) {
    createBarChart(data);
    createQuadrantChart(data);
    createParallelCoordinatesChart(data);
});

// Handle window resize using D3 to update charts
window.addEventListener('resize', function() {
    // Get updated dimensions
    dimensions = getDashboardDimensions();

    // Update SVG viewBox using D3
    svg.attr("viewBox", `0 0 ${dimensions.width} ${dimensions.height}`);

    // Update dashboard title position using D3
    svg.select("text").attr("x", dimensions.width / 2);

    // Update chart group transforms using D3
    svg.select(".bar-chart")
        .attr("transform", `translate(${dimensions.margin.left}, ${dimensions.margin.top + 40})`);

    svg.select(".quadrant-chart")
        .attr("transform", `translate(${dimensions.margin.left}, ${dimensions.margin.top + dimensions.chartHeight + 120})`);

    svg.select(".parallel-chart")
        .attr("transform", `translate(${dimensions.margin.left}, ${dimensions.margin.top + dimensions.chartHeight * 2 + 230})`);

    // Redraw charts with new dimensions using D3
    d3.csv("pokemon.csv").then(function(data) {
        // Clear existing chart content using D3
        barChartGroup.selectAll("*").remove();
        quadrantChartGroup.selectAll("*").remove();
        parallelChartGroup.selectAll("*").remove();

        // Recreate charts using D3
        createBarChart(data);
        createQuadrantChart(data);
        createParallelCoordinatesChart(data);
    });
});
