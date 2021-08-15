#[allow(dead_code)]
pub fn set_panic_hook() {
    // When the `console_error_panic_hook` feature is enabled, we can call the
    // `set_panic_hook` function at least once during initialization, and then
    // we will get better error messages if our code ever panics.
    //
    // For more details see
    // https://github.com/rustwasm/console_error_panic_hook#readme
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

pub type PlaneVector = (i32, i32);
pub type PlaneSize = (usize, usize);
pub type PlaneRect = (PlaneVector, PlaneSize);

#[allow(dead_code)]
pub fn is_vector_in_rect(v: PlaneVector, r: PlaneRect) -> bool {
    let (vx, vy) = v;
    let ((rx, ry), (rw, rh)) = r;
    vx >= rx && vx <= (rx + (rw as i32)) && vy >= ry && vy <= (ry + (rh as i32))
}

pub fn does_two_rects_overlap(r0: PlaneRect, r1: PlaneRect) -> bool {
    let ((x0, y0), (w0, h0)) = r0;
    let ((x1, y1), (w1, h1)) = r1;
    x0 < x1 + (w1 as i32) && x0 + (w0 as i32) > x1 && y0 + (h0 as i32) > y1 && y0 < y1 + (h1 as i32)
}
