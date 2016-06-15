$(document).ready(function() {
   
    var margin = {
        top: 20,
        right: 20,
        left: 20,
        bottom: 20
    };
    var width = 1160;
    var height = 660;
    
    var projection = d3.geo.albers()
        .center([0, 59.48])
        .rotate([-18.5, 0])
        .scale(21000)
        .translate([width / 2, height / 2]);

    
    var geoPath = d3.geo.path()
        .projection(projection);
    
    var mapIt = d3.map();
    
    var lowCol = '#00651F';
    var highCol = '#04155C';
    


    
    var colorScale = d3.scale.linear()
        .domain([0, 0.2])
        .range([lowCol, highCol])
        .interpolate(d3.interpolateLab);
    
    var opacityScale = d3.scale.linear()
        .domain([0,0.3])
        .range([0.1,1]);
    
   

    
    var platserSorted;
    var sokandeSorted;
    var geoSorted;
    
    
    //slider variables
    var sliderScale;
    var weekScale;
    var slider;
    
    var isPlaying = false;
    var interval;
    var currentFrame = 0;
    var frameLength = 500;
    
    var $weekText = $('#weekText');
    $weekText.html('<p>Vecka 1, Jan 2015</p>');
    
    
    
    //queue data
    
    queue()
        .defer(d3.csv, 'data/af-platser.csv', type)
        .defer(d3.csv, 'data/af-sokande.csv', type)
        .defer(d3.json, 'data/stockholm_kommun.geojson')
        .defer(d3.json, 'data/sweden.geojson')
        .await(pushData);
    
    
    //create SVG
    var svg = d3.select('#mapContainer').append('svg')
        .attr({
            width: width + margin.left + margin.right,
            height: height + margin.top + margin.bottom,
            id: 'mainSVG'
        });
    
    var g = svg.append('g')
        .attr({
            class: 'g',
            transform: 'translate(' + margin.left + ',' + margin.top + ')'
        });
    
    
      
   
    var defs = svg.append('defs');
    
    var filter = defs.append('filter')
        .attr({
            id: 'dropshadow',
            width: '200%',
            height: '200%'
        });
    
    
    filter.append('feOffset')
        .attr({
            in: 'SourceGraphic',
            dx: 10,
            dy: 10,
            result: 'offOut'
        });
    
    filter.append('feGaussianBlur')
        .attr({
            in: 'offOut',
            stdDeviation: 10,
            result: 'blurOut'
        });
    
    
    
    var feBlend = filter.append('feBlend').attr({
        in: 'SourceGraphic',
        in2: 'blurOut',
        mode: 'normal'
    });
    
    
    //legend
    var colourDefs = svg.append('defs');
    var gradient1 = colourDefs.append('linearGradient')
        .attr({
            id: 'gradient1',
            x1: '0%',
            x2: '100%'
        });
    
    gradient1.append('stop')
        .attr({
            offset: '0%'
        })
        .style({
            'stop-color': lowCol,
            'stop-opacity': 1
        });
    
    gradient1.append('stop')
        .attr({
            offset: '100%'
        })
        .style({
            'stop-color': highCol,
            'stop-opacity': 1
        });
    
    var opacityDefs = svg.append('defs');
    var gradient2 = opacityDefs.append('linearGradient')
        .attr({
            id: 'gradient2',
            y1: '0%',
            y2: '100%',
            x1: '0%',
            x2: '0%'
        });
    
    gradient2.append('stop')
        .attr({
            offset: '0%'
        })
        .style({
            'stop-color': '#fff',
            'stop-opacity': 0.1
        });
    
    gradient2.append('stop')
        .attr({
            offset: '100%'
        })
        .style({
            'stop-color': '#fff',
            'stop-opacity': 1
        });
    
    
    var legendHeight = 125;
    var legendWidth = 200;
    
    var legendScaleX = d3.scale.linear()
        .domain([0, 0.2])
        .range([0, legendWidth]);
    
    var legendScaleY = d3.scale.linear()
        .domain([0, 0.3])
        .range([legendHeight, 0]);
    
    var xAxis = d3.svg.axis()
        .scale(legendScaleX)
        .orient('bottom')
        .tickValues([0,0.2])
        .tickFormat(d3.format('%'));
    
    var yAxis = d3.svg.axis()
        .scale(legendScaleY)
        .orient('left')    
        .tickValues([0,0.3])
        .tickFormat(d3.format('%'));
    
    var legend = d3.selectAll('svg').append("g")
        .attr({
            transform: 'translate(975,525)'
        });
    
    legend.append('rect')
        .attr({
            id: 'legendColour',
            width: legendWidth,
            height: legendHeight,
            fill: 'url(#gradient1)'
        });
    
    legend.append('rect')
        .attr({
            id: 'legendOpacity',
            width: legendWidth,
            height: legendHeight,
            fill: 'url(#gradient2)'
        });   
    
    legend.append('g')
        .attr({
            class: 'x axis',
            transform: 'translate(0,'+ legendHeight + ')'
        })
        .call(xAxis);
    
    legend.append('g')
        .attr({
            class: 'y axis'
        })
        .call(yAxis);
    
    
        
    
   
    
    
    //load data
    function pushData(error, platser, sokande, geoshape, sweden) {

        if (error) throw error;
        
        platserSorted = platser.sort(function(a,b) {
            return a.KOMMUNKOD - b.KOMMUNKOD;
        });
        
        sokandeSorted = sokande.sort(function(a,b) {
            return a.KOMMUNKOD - b.KOMMUNKOD;
        });
        
        geoSorted = geoshape.features.sort(function(a,b) {
            return a.properties.KOMMUNKOD - b.properties.KOMMUNKOD;
        });
        
        
        
        //draw sweden outline
        g.selectAll('path.sweden')
            .data(sweden.features)
            .enter().append('path')
            .attr({
                d: geoPath,
                class: 'sweden'
            })
            .style({
                fill: '#f2f2f2'
                //filter: 'url(#dropshadow)'
            });
        
        
        //draw sthlm kommuner
        g.selectAll('path.kommun')
            .data(geoSorted)
            .enter().append('path')
            .attr({
                d: geoPath,
                class: 'kommun',
                id: function(d) {
                    return d.properties.KOMMUNNAMN;
                }
            })
            .style({
                fill: function(d, i) {
                    var platsPercent = platserSorted[i]['1'] / sokandeSorted[i]['1'];
                    var sokandePercent = sokandeSorted[i]['1'] / sokandeSorted[i].pop;                    
                    
                    return colorScale(sokandePercent);
                },
                opacity: function(d, i) {
                    var platsPercent = platserSorted[i]['1'] / sokandeSorted[i]['1'];
                    var sokandePercent = sokandeSorted[i]['1'] / sokandeSorted[i].pop;
                    
                    return opacityScale(platsPercent);
                },
                filter: 'url(#dropshadow)'
        });
        
        
        
        
        function createSlider() {
            sliderScale = d3.scale.linear()
                .domain([1, 53]);
            
            var val = slider ? slider.value() : 1;
            
            slider = d3.slider()
                .scale(sliderScale)
                .on('slide', function(event, value) {
                    if (isPlaying) {
                        clearInterval(interval);
                    }
                    currentFrame = value;
                    drawWeek(currentFrame, d3.event.type != 'drag');
                })
                .on('slideend', function() {
                    if (isPlaying) {
                        animate();
                    }
//                    d3.select('#sliderDiv').on('mousemove', sliderProbe);
                })
                .on('slidestart', function() {
                    d3.select('#sliderDiv').on('mousemove', null);
                })
                .value(val);
            
            d3.select('#sliderDiv').remove();
            
            d3.select('#timeSlider')
                .append('div')
                .attr({
                    id: 'sliderDiv'
                })
                .style({
                    width: '500px'
                })
//                .on('mousemove', sliderProbe)
//                .on('mouseout', function() {
//                    d3.select('#sliderProbe')
//                        .style({
//                            display: 'none'
//                        })
//                })
                .call(slider);
            
            d3.select('#sliderDiv a')
                .on('mousemove', function() {
                    d3.event.stopPropagation();
                });
            
        }
        
        
        function drawWeek(indexWeek) {
            
             g.selectAll('path.kommun')
                .transition()
                .duration(500)
                .ease('cubic-in-out')
                .style({
                    fill: function(d, i) {
                         var platsPercent = platserSorted[i][indexWeek] / sokandeSorted[i][indexWeek];
                    var sokandePercent = sokandeSorted[i][indexWeek] / sokandeSorted[i].pop;
                        
                        
                        return colorScale(sokandePercent);
                    },
                    opacity: function(d, i) {
                        var platsPercent = platserSorted[i][indexWeek] / sokandeSorted[i][indexWeek];
                    var sokandePercent = sokandeSorted[i][indexWeek] / sokandeSorted[i].pop;
                        
                       return opacityScale(platsPercent);
                    }
            });
            
            if (indexWeek >= 1 && indexWeek <= 5) {
                $weekText.html('<p>Vecka ' + indexWeek + ', Jan 2015</p>');
            } else if (indexWeek >= 6 && indexWeek <= 9) {
                $weekText.html('<p>Vecka ' + indexWeek + ', Feb 2015</p>');
            } else if (indexWeek >= 10 && indexWeek <= 13) {
                $weekText.html('<p>Vecka ' + indexWeek + ', Mar 2015</p>');
            } else if (indexWeek >= 14 && indexWeek <= 18) {
                $weekText.html('<p>Vecka ' + indexWeek + ', Apr 2015</p>');
            } else if (indexWeek >= 19 && indexWeek <= 22) {
                $weekText.html('<p>Vecka ' + indexWeek + ', Maj 2015</p>');
            } else if (indexWeek >= 23 && indexWeek <= 26) {
                $weekText.html('<p>Vecka ' + indexWeek + ', Jun 2015</p>');
            } else if (indexWeek >= 27 && indexWeek <= 31) {
                $weekText.html('<p>Vecka ' + indexWeek + ', Jul 2015</p>');
            } else if (indexWeek >= 32 && indexWeek <= 35) {
                $weekText.html('<p>Vecka ' + indexWeek + ', Aug 2015</p>');
            } else if (indexWeek >= 36 && indexWeek <= 39) {
                $weekText.html('<p>Vecka ' + indexWeek + ', Sep 2015</p>');
            } else if (indexWeek >= 40 && indexWeek <= 44) {
                $weekText.html('<p>Vecka ' + indexWeek + ', Okt 2015</p>');
            } else if (indexWeek >= 45 && indexWeek <= 48) {
                $weekText.html('<p>Vecka ' + indexWeek + ', Nov 2015</p>');
            } else if (indexWeek >= 49 && indexWeek <= 53) {
                $weekText.html('<p>Vecka ' + indexWeek + ', Dec 2015</p>');
            }
        }
        

        
       
        
         //play function
        
        d3.select('#play')
            .attr({
                title: 'Play Animation'
            })
            .on('click', function() {
            
                if (!isPlaying) {
                    isPlaying = true;
                    $('#play').css('backgroundPosition', '-78px -15px');
                    
                    d3.select(this)
                        .classed('pause', true)
                        .attr('title', 'Pause Animation');
                    animate();
                } else {
                    isPlaying = false;
                    $('#play').css('backgroundPosition', '-13px -15px');
                    d3.select(this)
                        .classed('pause', false)
                        .attr('title', 'Play Animation');
                    clearInterval(interval);
                }
            
            });
    
        
        $('#play').mouseover(function() {
            if (!isPlaying) {
                $('#play').css('backgroundPosition', '-13px -71px');
            } else {
                $('#play').css('backgroundPosition', '-78px -71px');
            }
        }).mouseleave(function() {
            if (!isPlaying) {
                $('#play').css('backgroundPosition', '-13px -15px');
            } else {
                $('#play').css('backgroundPosition', '-78px -15px');
            }
        })
        
        //animate function
        
        function animate() {
            
            interval = setInterval(function() {
                currentFrame++;
                
                if (currentFrame == 54) {
                    currentFrame = 0;
                }
                
                d3.select('#sliderDiv .d3-slider-handle')
                    .style('left', 100 * currentFrame / 53 + '%');
                
                slider.value(currentFrame);
                
                drawWeek(currentFrame, true);
                
                if (currentFrame == 53) {
                    isPlaying = false;
                    
                    d3.select('#play')
                        .classed('pause', false)
                        .attr('title', 'Play Animation');
                    
                    clearInterval(interval);
                    return;
                }
            }, frameLength);            
            
        }
        
        
         createSlider();
        
        
    } //close pushData
        
        
    
    function type(d) {
        d.year = +d.year;
        d['1'] = +d['1'];
        d['2'] = +d['2'];
        d['3'] = +d['3'];
        d['4'] = +d['4'];
        d['5'] = +d['5'];
        d['6'] = +d['6'];
        d['7'] = +d['7'];
        d['8'] = +d['8'];
        d['9'] = +d['9'];
        d['10'] = +d['10'];
        d['11'] = +d['11'];
        d['12'] = +d['12'];
        d['13'] = +d['13'];
        d['14'] = +d['14'];
        d['15'] = +d['15'];
        d['16'] = +d['16'];
        d['17'] = +d['17'];
        d['18'] = +d['18'];
        d['19'] = +d['19'];
        d['20'] = +d['20'];
        d['21'] = +d['21'];
        d['22'] = +d['22'];
        d['23'] = +d['23'];
        d['24'] = +d['24'];
        d['25'] = +d['25'];
        d['26'] = +d['26'];
        d['27'] = +d['27'];
        d['28'] = +d['28'];
        d['29'] = +d['29'];
        d['30'] = +d['30'];
        d['31'] = +d['31'];
        d['32'] = +d['32'];
        d['33'] = +d['33'];
        d['34'] = +d['34'];
        d['35'] = +d['35'];
        d['36'] = +d['36'];
        d['37'] = +d['37'];
        d['38'] = +d['38'];
        d['39'] = +d['39'];
        d['40'] = +d['40'];
        d['41'] = +d['41'];
        d['42'] = +d['42'];
        d['43'] = +d['43'];
        d['44'] = +d['44'];
        d['45'] = +d['45'];
        d['46'] = +d['46'];
        d['47'] = +d['47'];
        d['48'] = +d['48'];
        d['49'] = +d['49'];
        d['50'] = +d['50'];
        d['51'] = +d['51'];
        d['52'] = +d['52'];
        d['53'] = +d['53'];
        d.pop = +d.pop;
        d.KOMMUNKOD = +d.KOMMUNKOD;
        return d;
        
    } //close type
    

        
    
    
   
    
}); //doc.ready