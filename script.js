
const display = document.getElementById("display");
const clickSound = document.getElementById("clickSound");

function press(value) {
    clickSound.play();
    display.value += value;
}

function clearDisplay() {
    clickSound.play();
    display.value = "";
}

function calculate() {
    clickSound.play();
    try {
        display.value = eval(display.value);
    } catch {
        display.value = "🌧️ Oops!";
    }
}
