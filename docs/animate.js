
/* bubble sort zen
 * (c) Ilya V. Schurov, 2017
 * License: MIT 
 */
// jshint esversion: 6
// FROM: http://stackoverflow.com/a/2450976/3025981

BSZ_APP = {n: 25, rows: 5, spacing: 70, margin: 3};

function cx(d, i) {
    return (Math.floor(i / BSZ_APP.rows)) * BSZ_APP.spacing + r([BSZ_APP.n]) + BSZ_APP.margin;
}

function cy(d, i) {
    return (BSZ_APP.rows - (i % BSZ_APP.rows) - 1) * BSZ_APP.spacing + r([BSZ_APP.n]) + BSZ_APP.margin;
}

function r(d) {
    return d[0];
}

function shuffle(array) {
    var currentIndex = array.length,
        temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}
// END FROM

function do_shuffle() {
    var arr = d3.select("#picture")
        .selectAll("circle").data();

    _.forEach(arr, function(el) {
        el[1] = 0;
    });

    shuffle(arr);
    update(arr, null, true);
}

function init(n) {
    var arr = _.zip(_.range(1, n + 1),
        new Array(n).fill(0));
    update(arr);
}

$(function() {
    var balls = _.range(BSZ_APP.n);
    var max_radius = r([BSZ_APP.n]);
    var max_cx = _.max(_.map(balls, cx));
    var max_cy = _.max(_.map(balls, cy))
    $("#picture").attr("width", max_cx + max_radius + BSZ_APP.margin*2)
        .attr("height", max_cy + max_radius + BSZ_APP.margin*2);
    init(BSZ_APP.n);
    do_shuffle();
    // if buttons are presented
    $("#btnShuffle").on('click', do_shuffle);
    $("#btnSort").on('click', update.bind(null, null, null));
});

function* bubble_sort(arr) {
    var sorted = false;
    var temp;
    var end = arr.length - 1;
    var i;
    while (!sorted) {
        sorted = true;
        for (i = 0; i < end; i++) {
            if (arr[i][0] > arr[i + 1][0]) {
                temp = arr[i];
                arr[i] = arr[i + 1];
                arr[i+1] = temp;
                sorted = false;
            }
            arr[i+1][1] = 2;
            arr[i][1] = 0;
            yield arr;
        }
        arr[end][1] = 1;
        end--;
    }
    for (i = end; i >= 0; i--) {
        arr[i][1] = 1;
        yield arr;
    }
}

// FROM: http://stackoverflow.com/a/27043807/3025981
function endAll(transition, callback) {
    var n;
    if (transition.empty()) {
        callback();
    } else {
        n = transition.size();
        transition.on("end", function() {
            n--;
            if (n === 0) {
                callback();
            }
        });
    }
}
// END FROM

function get_data() {
    // BASED ON: http://stackoverflow.com/a/22118052/3025981
    var indexes = [];
    var circles = d3.select("#picture")
        .selectAll("circle");
    var initial_array = circles.data();
    circles.each(function(d, i) {
        indexes.push(+d3.select(this).attr('data-position'));
    });
    // END BASED
    var data = [];
    for (i = 0; i < initial_array.length; i++) {
        data[indexes[i]] = initial_array[i];
    }
    return data;
}

function update(arr, sorter, beginsorting=false) {
    // if arr is defined and sorter is undefined, just
    // update data to arr, do transitions
    // if sorter is defined, get its next()
    // value, update according to the result
    // and continue until sorting complete
    // if no parameters defined, get
    // arr from the data, create sorter
    // and run update with that sorter

    function key(d) {
        return d[0];
    }


    function position(d, i) {
        return i;
    }

    function fill(d) {
        colors ={0: "steelblue", 1: "#00802b", 2: "#b30059"} 
        return colors[d[1]]
    }

    function update_transition(selection) {
        return selection.attr("data-position", position)
            .transition()
            .duration(1000)
            .attr("cx", cx)
            .attr("cy", cy)
            .style("fill", fill);
    }

    var circles = d3.select("#picture")
        .selectAll("circle");

    if (arr != null) {
        circles = circles.data(arr, key);
        circles
            .enter()
            .append("circle")
            .attr("r", r)
            .attr("cy", cy)
            .attr("cx", cx)
            .attr("data-position", position)
            .style("fill", "steelblue");
        var transition = update_transition(circles);
        if (beginsorting) {
            transition.call(endAll, update.bind(null, null, null));
        }
    }

    if (sorter != null) {
        next = sorter.next();
        if (!next.done) {
            update_transition(circles.data(next.value, key))
                .call(endAll, update.bind(null, null, sorter));
        } else {
            do_shuffle();
        }
    }

    if (arr == null && sorter == null) {
        $("#btnSort").attr("disabled", true);
        update(null, bubble_sort(get_data()));
    }
}
