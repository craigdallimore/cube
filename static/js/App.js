/*global Bacon, console*/


(function(Bacon) {

    'use strict';

    function Transformable(el) {
        this.el = el;
    }

    Transformable.prototype.setTransformStyle = function(cssStyle) {
        this.el.style['-webkit-transform'] = cssStyle;
        this.el.style['-moz-transform'] = cssStyle;
        this.el.style['-ms-transform'] = cssStyle;
        this.el.style['-o-transform'] = cssStyle;
        this.el.style.transform = cssStyle;
    };

    function add(a, b) {
        return parseInt(a, 10) + parseInt(b, 10);
    }

    function getWidth(e) {
        return e.target.clientWidth;
    }

    function getHeight(e) {
        return e.target.clientHeight;
    }

    function toPercentage(total, point) {
        return (point / total * 100).toFixed();
    }

    function toVertical(point) {
        return 1 - (point / 50);
    }

    function toHorizontal(point) {
        return -1 + (point / 50);
    }

    function toDegrees(x, y) {
        var dx          = Math.abs(50 - x),
            dy          = Math.abs(50 - y),
            hypotenuse  = Math.sqrt(dx * dx + dy * dy);

        return hypotenuse < 70 ? Math.floor(hypotenuse) : 70;
    }

    function getRotationStyle(v, h, d) {
        return 'rotate3d(' + v + ', ' + h  + ', 0, ' + d  + 'deg)';
    }

    function getRandomRotationValues() {
        return {
            vertical    : ( -1 + (Math.random() * 2) ).toFixed(1),
            horizontal  : ( -1 + (Math.random() * 2) ).toFixed(1),
            degrees     : Math.round(Math.random() * 70)
        };
    }

    function getRandomInterval() {
        return Math.floor(Math.random() * 1400) + 800;
    }

    function randomAngle(subscriber) {

        var t;

        function twitch() {
            subscriber( new Bacon.Next(getRandomRotationValues));
            t = setTimeout(twitch, getRandomInterval());
        }

        twitch();

        return function() {
            if (t) { clearTimeout(t); }
        };
    }

    function wobble(subscriber) {

        var numOscillations = 10,
            magnitude = 25,
            t,
            dir = -1;


        function flick() {

            magnitude *= 0.8;


            dir = dir < 0 ? 1 : -1;     // Go back and forth
            dir = dir * magnitude;

            subscriber( new Bacon.Next(dir));

            if (numOscillations > 0) {
                numOscillations--;
                t = setTimeout(flick, 120);
            } else {
                subscriber( new Bacon.End() );
            }
        }

        flick();

        return function() {
            if (t) { clearTimeout(t); }
        };

    }

    var body            = document.body,
        cube            = new Transformable(document.querySelector('.cube')),
        mouseMove       = Bacon.fromEventTarget(body, 'mousemove').debounceImmediate(50),
        mouseX          = mouseMove.map('.clientX'),
        mouseY          = mouseMove.map('.clientY'),

        mouseEnter      = Bacon.fromEventTarget(body, 'mouseover').map(true),
        mouseLeave      = Bacon.fromEventTarget(body, 'mouseout').map(false),
        mousePresent    = mouseEnter.merge(mouseLeave).toProperty(true),

        windowResize    = Bacon.fromEventTarget(window, 'resize').debounceImmediate(50),
        bodyWidth       = windowResize.map(getWidth).toProperty(body.clientWidth),
        bodyHeight      = windowResize.map(getHeight).toProperty(body.clientHeight),

        pointXPercent   = bodyWidth.sampledBy(mouseX, toPercentage),
        pointYPercent   = bodyHeight.sampledBy(mouseY, toPercentage),

        lineOfSightX    = new Bacon.Bus(),
        lineOfSightY    = new Bacon.Bus(),
        reactionBus     = new Bacon.Bus(),

        pointXWobble    = Bacon.combineWith(add, reactionBus, pointXPercent).changes(),

        pointDeg        = lineOfSightX.zip(lineOfSightY, toDegrees),
        pointV          = lineOfSightY.map(toVertical),
        pointH          = lineOfSightX.map(toHorizontal),

        horizontal      = new Bacon.Bus(),
        vertical        = new Bacon.Bus(),
        degrees         = new Bacon.Bus(),

        wobbleStream = mouseLeave.flatMapLatest(function() {
            return new Bacon.EventStream(wobble).scan(0, add);
        }).concat( new Bacon.once(0)).filter(mousePresent.not()),

        wobbling = reactionBus.toProperty().map(function(val) {
            return val !== 0;
        }),

        twitchStream = new Bacon.EventStream(randomAngle)
            .filter(mousePresent.not())
            .filter(wobbling),

        cubeAngle       = Bacon.combineWith(getRotationStyle, vertical, horizontal, degrees);

    mouseEnter.onValue(function() {
        reactionBus.push(0);
    });

    horizontal.plug(pointH);
    vertical.plug(pointV);
    degrees.plug(pointDeg);

    reactionBus.plug(wobbleStream);

    lineOfSightX.plug(pointXWobble);
    lineOfSightY.plug(pointYPercent);

    twitchStream.onValue(function(twitch) {
        horizontal.push(twitch.horizontal);
        vertical.push(twitch.vertical);
        degrees.push(twitch.degrees);
    });

    cubeAngle.assign(cube, 'setTransformStyle');

} (Bacon));
