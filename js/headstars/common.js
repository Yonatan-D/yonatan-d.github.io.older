function bannerLine(options) {
    //移动端
    var u = navigator.userAgent, app = navigator.appVersion;
    if(!!u.match(/AppleWebKit.*Mobile.*/)){
        return;
    }
    if( navigator.appName == "Microsoft Internet Explorer" && 
        parseInt(app.split(";")[1].replace(/[ ]/g, "").replace("MSIE",""))<=9){
        return;
    }
    if( options instanceof jQuery ){
        options = {parent:options};
    }
    if(options.parent instanceof jQuery){
        var $dom = $(options.parent);
        $.each($dom,function(){
            options.parent = $(this);            
            bannerLineStart( options );
        });
    }else{
        bannerLineStart( options );
    }
}

function bannerLineStart(options) {
    var defaultOption = {
        parent: $("body"),
        className: "animateLineBox",
        css: {},
        color: [255, 255, 255],
        line: 10
    }
    options = $.extend({}, defaultOption, options);
    var $canvas = $('<canvas class="' + options.className + '" ></canvas>').prependTo(options.parent);
    options.parent.css({
        'position': 'relative'
    });
    $canvas.css({
        'position': 'absolute',
        'padding': '0px',
        'top': 0,
        'pointer-events': 'none'
    });
    var canvasHeight = options.parent.outerHeight() + 'px';
    var canvasWidth = options.parent.outerWidth() + 'px';
    $canvas.css({
        'width': canvasWidth,
        'height': canvasHeight,
    }).css(options.css);

    var width, height, largeHeader, canvas, ctx, points, target, animateHeader = true;
    var $color = options.color;
    initHeader();
    initAnimation();
    addListeners();

    function initHeader() {
        canvas = $canvas.get(0);
        width = $($canvas).width();
        height = $($canvas).height();
        target = {
            x: width / 2,
            y: height / 2
        };
        canvas.width = width;
        canvas.height = height;
        ctx = canvas.getContext('2d');

        // create points
        points = [];
        var pointLine = options.line;
        for (var x = 0; x < width; x = x + width / pointLine) {
            for (var y = 0; y < height; y = y + height / pointLine) {
                var px = x + Math.random() * width / pointLine;
                var py = y + Math.random() * height / pointLine;
                var p = {
                    x: px,
                    originX: px,
                    y: py,
                    originY: py
                };
                points.push(p);
            }
        }

        // for each point find the 5 closest points
        for (var i = 0; i < points.length; i++) {
            var closest = [];
            var p1 = points[i];
            for (var j = 0; j < points.length; j++) {
                var p2 = points[j]
                if (!(p1 == p2)) {
                    var placed = false;
                    for (var k = 0; k < 5; k++) {
                        if (!placed) {
                            if (closest[k] == undefined) {
                                closest[k] = p2;
                                placed = true;
                            }
                        }
                    }
                    for (var k = 0; k < 5; k++) {
                        if (!placed) {
                            if (getDistance(p1, p2) < getDistance(p1, closest[k])) {
                                closest[k] = p2;
                                placed = true;
                            }
                        }
                    }
                }
            }
            p1.closest = closest;
        }
        // assign a circle to each point
        for (var i in points) {
            var c = new Circle(points[i], 2 + Math.random() * 2, 'rgba(' + $color[0] + ',' + $color[1] + ',' + $color[2] + ',0.2)');
            points[i].circle = c;
        }
    }
    // Event handling

    function addListeners() {
        if (!('ontouchstart' in window)) {
            window.addEventListener('mousemove', mouseMove);
        }
        window.addEventListener('resize', resize);
    }

    function mouseMove(e) {
        var posx = posy = 0;
        if (e.pageX || e.pageY) {
            posx = e.pageX - (document.body.scrollLeft + document.documentElement.scrollLeft);
            posy = e.pageY - (document.body.scrollTop + document.documentElement.scrollTop);
            posy = e.pageY - $canvas.offset().top;
        } else if (e.clientX || e.clientY) {
            posx = e.clientX;
            posy = e.clientY;
        }
        target.x = posx;
        target.y = posy;
    }

    function resize() {
        canvasWidth = ($canvas).parent().outerWidth();
        canvasHeight = ($canvas).parent().outerHeight();
        $canvas.css({
            'width': canvasWidth,
            'height': canvasHeight,
        });
    }
    // animation
    function initAnimation() {
        animate();
        for (var i in points) {
            shiftPoint(points[i]);
        }
    }
    function animate() {
        if (animateHeader) {
            ctx.clearRect(0, 0, width, height);
            for (var i in points) {
                // detect points in range
                if (Math.abs(getDistance(target, points[i])) < 4000) {
                    points[i].active = 0.3;
                    points[i].circle.active = 0.6;
                } else if (Math.abs(getDistance(target, points[i])) < 20000) {
                    points[i].active = 0.1;
                    points[i].circle.active = 0.3;
                } else if (Math.abs(getDistance(target, points[i])) < 40000) {
                    points[i].active = 0.02;
                    points[i].circle.active = 0.1;
                } else {
                    points[i].active = 0;
                    // points[i].circle.active = 0;
                    if(typeof points[i].circle != 'undefined'){
                        points[i].circle.active = 0;
                    }
                }

                drawLines(points[i]);
                if(typeof points[i].circle != 'undefined'){
                    points[i].circle.draw();
                }
            }
        }
        requestAnimationFrame(animate);
    }

    function shiftPoint(p) {
        TweenLite.to(p, 1 + 1 * Math.random(), {
            x: p.originX - 50 + Math.random() * 100,
            y: p.originY - 50 + Math.random() * 100,
            ease: Circ.easeInOut,
            onComplete: function() {
                shiftPoint(p);
            }
        });
    }
    // Canvas manipulation

    function drawLines(p) {
        if (!p.active) return;
        for (var i in p.closest) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.closest[i].x, p.closest[i].y);
            ctx.strokeStyle = 'rgba(' + $color[0] + ',' + $color[1] + ',' + $color[2] + ',' + p.active + ')';
            ctx.stroke();
        }
    }

    function Circle(pos, rad, color) {
        var _this = this;
        // constructor
        (function() {
            _this.pos = pos || null;
            _this.radius = rad || null;
            _this.color = color || null;
        })();

        this.draw = function() {
            if (!_this.active) return;
            ctx.beginPath();
            ctx.arc(_this.pos.x, _this.pos.y, _this.radius, 0, 2 * Math.PI, false);
            ctx.fillStyle = 'rgba(' + $color[0] + ',' + $color[1] + ',' + $color[2] + ',' + _this.active + ')';
            ctx.fill();
        };
    }
    // Util
    function getDistance(p1, p2) {
        return Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
    }
    return $canvas;
}


$(document).ready(function() {
    bannerLine({
        parent: $(".header"),
        color: [0, 0, 0],
        css: {
            top: 0,
            opacity: 0.8

        },
        line: 13
    });
});
