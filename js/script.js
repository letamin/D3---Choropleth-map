Promise.all([
    d3.tsv('https://unpkg.com/world-atlas@1.1.4/world/50m.tsv'),    //Data for the country names (uses the country id to get name)
    d3.json('https://unpkg.com/world-atlas@1.1.4/world/50m.json')   //Data for the countries (inclues the country id to get name later)
]).then(([tsvData, topojsonData]) => {
    appendTooltip();
    const pathGenerator = initialize();
    const countryById = getCountryById(tsvData);
    const countries = topojson.feature(topojsonData, topojsonData.objects.countries);

    countries.features.forEach(d => {
        Object.assign(d.properties, countryById[d.id])
    })

    const g = d3.select('.svgGroup');

    g.selectAll('path').data(countries.features)
        .enter().append('path')
        .attr('class', 'countries')
        .attr('d', pathGenerator)
        .attr('transform', `translate(265, 100)`)
        .on('mouseover', d => hoverOver(d, d.properties.name))
        .on('mouseout', hoverDone)

}).catch(err => console.log(err))

function initialize() {
    const width = document.body.clientWidth;
    const height = document.body.clientHeight;
    const svg = d3.select('svg');
    const g = svg.append('g').attr('class', 'svgGroup');
    const projection = d3.geoOrthographic();       //For more details on d3 geo: https://github.com/d3/d3-geo
    const pathGenerator = d3.geoPath().projection(projection);

    svg.attr('width', width).attr('height', height);

    g.append('path')
        .attr('class', 'sphere')
        .attr('d', pathGenerator({ type: 'Sphere' }))
        .attr('transform', `translate(265, 100)`)

    //For more details on d3 zoom and pan: https://github.com/d3/d3-zoom
    svg.call(d3.zoom().on('zoom', () => {
        g.attr('transform', d3.event.transform)
    }))

    return pathGenerator;
}

const appendTooltip = () => {
    d3.select("body").append("div")
        .attr("class", "tooltip")
}

const getCountryById = (tsvData) => {
    const countryById = tsvData.reduce((name, index) => {
        name[index.iso_n3] = index;
        return name
    }, {})

    return countryById
}

const hoverOver = (d, countryName) => {
    const tooltip = d3.select('.tooltip');
    console.log(countryName)
    tooltip.html(countryName)
        .style("visibility", 'visible')
        .style("left", (d3.event.pageX + 10) + "px")
        .style("top", (d3.event.pageY - 15) + "px");
}

const hoverDone = () => {
    const tooltip = d3.select('.tooltip');
    tooltip.style("visibility", 'hidden');
}

