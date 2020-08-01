Promise.all([
    d3.tsv('https://unpkg.com/world-atlas@1.1.4/world/50m.tsv'),    //Data for the country names (uses the country id to get name)
    d3.json('https://unpkg.com/world-atlas@1.1.4/world/50m.json')   //Data for the countries (inclues the country id to get name later)
]).then(([tsvData, topojsonData]) => {
    const { pathGenerator, countries, colorLegendGroup } = initialize(tsvData, topojsonData);

    appendTooltip();
    render(countries, pathGenerator, colorLegendGroup);

}).catch(err => console.log(err))

//Render function
const render = (countries, pathGenerator, colorLegendGroup) => {
    colorScale.domain(countries.features.map(colorValue).sort().reverse())
        .range(d3.schemeYlOrBr[colorScale.domain().length]);    //Create some colors for our map. More information: https://github.com/d3/d3-scale-chromatic/blob/master/README.md

    colorLegend(colorLegendGroup, {
        colorScale,
        circleRadius: 15,
        legendSpacing: 45,
        textOffset: 25
    })

    const g = d3.select('.svgGroup');
    g.selectAll('path').data(countries.features)
        .enter().append('path')
        .attr('class', 'countries')
        .attr('d', pathGenerator)
        .attr('fill', d => colorScale(colorValue(d)))
        .attr('transform', `translate(265, 100)`)
        .on('mouseover', d => hoverOver(d.properties.name, colorValue(d)))
        .on('mouseout', hoverDone)
}

const colorScale = d3.scaleOrdinal();
const colorValue = d => d.properties.income_grp; //get the color based on the coutry's income group

//Initialize the data for our map
function initialize(tsvData, topojsonData) {
    const width = document.body.clientWidth;
    const height = document.body.clientHeight;
    const svg = d3.select('svg');
    const g = svg.append('g').attr('class', 'svgGroup');
    const projection = d3.geoStereographic();       //For more details on d3 geo: https://github.com/d3/d3-geo
    const pathGenerator = d3.geoPath().projection(projection);

    svg.attr('width', width).attr('height', height);

    g.append('path')
        .attr('class', 'sphere')
        .attr('d', pathGenerator({ type: 'Sphere' }))
        .attr('transform', `translate(265, 100)`)

    zoomAndPan(g, svg);

    const countriesById = getCountriesByIds(tsvData);
    const countries = topojson.feature(topojsonData, topojsonData.objects.countries);
    const colorLegendGroup = svg.append('g').attr('transform', `translate(160, 500)`);

    countries.features.forEach(d => {
        Object.assign(d.properties, countriesById[d.id])
    })

    return { pathGenerator, countries, svg, colorLegendGroup };
}

//Zoom and pan function
const zoomAndPan = (g, svg) => {
    //For more details on d3 zoom and pan: https://github.com/d3/d3-zoom
    svg.call(d3.zoom().on('zoom', () => {
        g.attr('transform', d3.event.transform)
    }))
}

const appendTooltip = () => {
    d3.select("body").append("div")
        .attr("class", "tooltip")
}

const getCountriesByIds = (tsvData) => {
    const countriesById = tsvData.reduce((name, index) => {
        name[index.iso_n3] = index;
        return name
    }, {})

    return countriesById
}

//Add tooltip when hover over a country
const hoverOver = (countryName, countryColor) => {
    const tooltip = d3.select('.tooltip');
    tooltip.text(`${countryName}: ${countryColor.split('.')[1]}`)
        .style("visibility", 'visible')
        .style("left", (d3.event.pageX + 10) + "px")
        .style("top", (d3.event.pageY - 15) + "px");
}

//Remove the tooltip when mouse out
const hoverDone = () => {
    const tooltip = d3.select('.tooltip');
    tooltip.style("visibility", 'hidden');
}

//Add legends
const colorLegend = (selection, props) => {
    const { colorScale, circleRadius, legendSpacing, textOffset } = props;

    const legendDatajoin = selection.selectAll('g')
        .data(colorScale.domain().reverse());

    const legendGroups = legendDatajoin
        .enter().append('g')
        .attr('class', 'legend')
        .attr('transform', (_d, i) => `translate(0, ${i * legendSpacing})`);

    //legend color circles
    legendGroups
        .append('circle')
        .attr('r', circleRadius)
        .attr('fill', colorScale);

    //legend texts
    legendGroups
        .append('text')
        .text(d => d.split('.')[1])
        .attr('dy', '0.32em')
        .attr('x', textOffset);
}