(function(Bacon) {

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

    function getRotationStyle(vertical, horizontal, degrees) {
        return 'rotate3d(' + vertical + ', ' + horizontal  + ', 0, ' + degrees  + 'deg)';
    }

    function getRandomRotationStyle() {
        var vertical    = ( -1 + (Math.random() * 2) ).toFixed(1),
            horizontal  = ( -1 + (Math.random() * 2) ).toFixed(1),
            degrees     = Math.round(Math.random() * 70);
        return getRotationStyle(vertical, horizontal, degrees);
    }

    function Transformable(el) {
        this.el = el;
    }

    function getRandomInterval() {
        return Math.floor(Math.random() * 1400) + 800;
    }

    function worry(subscriber) {

        var t;

        function twitch() {
            subscriber( new Bacon.Next(getRandomRotationStyle));
            t = setTimeout(twitch, getRandomInterval());
        }

        twitch();

        return function() {
            if (t) clearTimeout(t);
        }

    }

    Transformable.prototype.setTransformStyle = function(cssStyle) {
        this.el.style.transform = cssStyle;
    };

    var body            = document.body,
        cube            = new Transformable(document.querySelector('.cube')),

        mouseMove       = Bacon.fromEventTarget(body, 'mousemove').debounceImmediate(50),
        mouseX          = mouseMove.map('.clientX'),
        mouseY          = mouseMove.map('.clientY'),

        mouseEnter      = Bacon.fromEventTarget(body, 'mouseenter').map(true),
        mouseLeave      = Bacon.fromEventTarget(body, 'mouseleave').map(false),
        mousePresent    = mouseEnter.merge(mouseLeave).toProperty(true),

        windowResize    = Bacon.fromEventTarget(window, 'resize').debounceImmediate(50),
        bodyWidth       = windowResize.map(getWidth).toProperty(body.clientWidth),
        bodyHeight      = windowResize.map(getHeight).toProperty(body.clientHeight),

        mouseXPercent   = bodyWidth.sampledBy(mouseX, toPercentage),
        mouseYPercent   = bodyHeight.sampledBy(mouseY, toPercentage),

        mouseDeg        = mouseXPercent.zip(mouseYPercent, toDegrees),
        mouseV          = mouseYPercent.map(toVertical),
        mouseH          = mouseXPercent.map(toHorizontal),

        vertical        = new Bacon.Bus(),
        horizontal      = new Bacon.Bus(),
        degrees         = new Bacon.Bus(),

        mouseAngle      = Bacon.combineWith(getRotationStyle, vertical, horizontal, degrees).changes(),
        twitchAngle     = new Bacon.EventStream(worry).filter(mousePresent.not());

        vertical.plug(mouseV);
        horizontal.plug(mouseH);
        degrees.plug(mouseDeg);


        transformStyles = mouseAngle.merge(twitchAngle).toProperty(),
        transformStyles.assign(cube, 'setTransformStyle');


    // TODO
    // Animation where the shock of losing the mouse is shown

} (Bacon));
