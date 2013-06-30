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
        console.log('rc');
        return 'rotate3d(' + vertical + ', ' + horizontal  + ', 0, ' + degrees  + 'deg)';
    }

    function randomSeek() {
        console.log('lol random');
    }

    function Transformable(el) {
        this.el = el;
    }

    Transformable.prototype.setTransformStyle = function(cssStyle) {
        this.el.style.transform = cssStyle;
    };

    var body            = document.body,
        cube            = new Transformable(document.querySelector('.cube')),

        mouseMove       = Bacon.fromEventTarget(body, 'mousemove').debounceImmediate(50),
        mouseX          = mouseMove.map('.clientX'),
        mouseY          = mouseMove.map('.clientY'),

        windowResize    = Bacon.fromEventTarget(window, 'resize').debounceImmediate(50),
        bodyWidth       = windowResize.map(getWidth).toProperty(body.clientWidth),
        bodyHeight      = windowResize.map(getHeight).toProperty(body.clientHeight),

        mouseXPercent   = bodyWidth.sampledBy(mouseX, toPercentage),
        mouseYPercent   = bodyHeight.sampledBy(mouseY, toPercentage),

        horizontal      = mouseXPercent.map(toHorizontal),
        vertical        = mouseYPercent.map(toVertical),
        degrees         = mouseXPercent.zip(mouseYPercent, toDegrees),

        rotationStyle   = Bacon.combineWith(getRotationStyle, vertical, horizontal, degrees);

        rotationStyle.assign(cube, 'setTransformStyle');

    // TODO
    // Random twitches / seeking behaviour
    // Animation where the shock of losing the mouse is shown
    // Cancel twitches upon finding mouse

} (Bacon));
