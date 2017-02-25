/* bubble sort zen
 * (c) Ilya V. Schurov, 2017
 * License: MIT 
 */
// jshint esversion: 6
function sorting_widget(picture_selector, number_of_elements, options) {
    var picture = d3.select(picture_selector);
    options = options || {};
    var max_picture_size = options.max_picture_size || 400;
    var min_picture_size = options.min_picture_size || 100;
    var rows = options.rows || 6;
    var margin = options.margin || 3;
    var spacing = options.spacing || 1.4;
    var duration = options.duration || 700;
    var colors = options.colors || {'default': "#7570b3", 'bubble': '#d95f02', 'sorted': '#1b9e77'};

    var max_r = _.max(_.map(_.range(number_of_elements), i => r([i])))
    
    function cx(d, i) {
        return (Math.floor(i / rows)) * 2 * max_r * spacing + max_r + margin;
    }

    function cy(d, i) {
        return (rows - (i % rows) - 1) * 2 * max_r * spacing + max_r + margin;
    }

    function r(d) {
        return d[0];
    }

    function mkbbox() {
        var balls = _.range(number_of_elements);
        var max_cx = _.max(_.map(balls, cx.bind(null, null)));
        var max_cy = _.max(_.map(balls, cy.bind(null, null)));

        var inner_width = window.innerWidth;
        var inner_height = window.innerHeight;

        function bound(x, left, right) {
            if (x > right) {
                return right;
            }
            if (x < left) {
                return left;
            }
            return x;
        }

        var svg_size = bound(Math.min(inner_width, inner_height), min_picture_size, max_picture_size);

        var bbox_size = "" + (max_cx + max_r + margin*2);

        $(picture.node()).attr("height", svg_size)
            .attr("width", svg_size)
            .attr("viewBox", "0 0 " + bbox_size + " " + bbox_size);
    }
    $(function() {
        mkbbox()
        init(number_of_elements);
        do_shuffle();
    });

    $(window).resize(mkbbox);

    function do_shuffle() {
        var arr = picture
            .selectAll("circle").data();

        _.forEach(arr, function(el) {
            el[1] = 'default';
        });

        arr = _.shuffle(arr);
        update(arr, null, true);
    }

    function init(n) {
        var arr = _.zip(_.range(1, n + 1),
            new Array(n).fill('default'));
        update(arr);
    }

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
                arr[i+1][1] = 'bubble';
                arr[i][1] = 'default';
                yield arr;
            }
            arr[end][1] = 'sorted';
            end--;
        }
        for (i = end; i >= 0; i--) {
            arr[i][1] = 'sorted';
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
        var circles = picture.selectAll("circle");
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
            //colors ={0: "steelblue", 1: "#00802b", 2: "#b30059"} 
            //colors = {0: "#56b4e9", 1: "rgb(240, 228, 66)", 2: "rgb(213, 94, 0)"};
            
            return colors[d[1]];
        }

        function update_transition(selection) {
            return selection.attr("data-position", position)
                .transition()
                .duration(duration)
                .attr("cx", cx)
                .attr("cy", cy)
                .style("fill", fill);
        }

        var circles = picture
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
                .style("fill", fill([null, "default"]));
            var transition = update_transition(circles);
            if (beginsorting) {
                console.log("begin sorting");
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
            update(null, bubble_sort(get_data()));
        }
    }
}
