//? calculate spf: 1 / (hz / 100) # seconds per frame

document.querySelectorAll<HTMLCanvasElement>(".visual canvas")
    .forEach(elm => {
        elm.width = 270
        elm.height = 180

        elm.parentElement.style.width = "270px"
    })

document.querySelectorAll<HTMLCanvasElement>("canvas.sync")
    .forEach(elm => {
        elm.width = 75
        elm.height = 75
    })

function getRandomHexColor() {
    const randomColor = Math.floor(Math.random() * 16777215)
    const hexColor = '#' + randomColor.toString(16).padStart(6, '0')
    return hexColor
}

function getRandomReal(min: number, max: number) {
    return Math.random() * (max - min + Number.EPSILON) + min
}

async function draw(elm: HTMLCanvasElement, spf: number, count = 0) {
    return new Promise<void>((res, _) => {
        let start = null
        let maxTime = spf * 1000

        const ctx = elm.getContext("2d")
        const width = elm.width
        const height = elm.height
        const color = getRandomHexColor()

        const innerDraw = (timestamp: DOMHighResTimeStamp) => {
            if (start == null) start = timestamp
            const elapsed = timestamp - start

            //ctx.clearRect(0, 0, width, height)

            const curHeight = Math.min(elapsed / maxTime, 1) * height
            ctx.fillStyle = color
            ctx.fillRect(0, 0, width, curHeight)

            ctx.font = "32px monospace"
            ctx.textAlign = "center"
            ctx.textBaseline = "middle"
            ctx.fillStyle = "white"
            ctx.fillText(count.toString(), width / 2, height / 2)

            if (elapsed <= maxTime) requestAnimationFrame(innerDraw)
            else res()
        }

        requestAnimationFrame(innerDraw)
    })
}

function drawSync(canvas: HTMLCanvasElement, percentage: number) {
    const ctx = canvas.getContext("2d")
    const radius = Math.min(canvas.width, canvas.height) / 2
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.fillStyle = 'white' // Background color
    ctx.fill()

    const endAngle = percentage * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.arc(centerX, centerY, radius, 0, endAngle)
    ctx.lineTo(centerX, centerY)
    ctx.fillStyle = '#76c7c0'
    ctx.fill()
}

function copy(src: HTMLCanvasElement, dest: HTMLCanvasElement) {
    const destCtx = dest.getContext("2d")

    destCtx.clearRect(0, 0, dest.width, dest.height)
    destCtx.drawImage(src, 0, 0)
}

async function delay(time: number) {
    return new Promise((res, _) => setTimeout(res, time))
}

function screenTearing(spf: number, spfRandomMin: number, spfRandomMax: number) {
    let start = null
    let maxTime = spf * 1000
    const screen = document.querySelector<HTMLCanvasElement>("#screen-st")
    const back = document.querySelector<HTMLCanvasElement>("#back-st")

    const sync = document.querySelector<HTMLCanvasElement>("#sync-st")

    let cnt = 0
    const drawData = async () => {
        let drawTime = getRandomReal(spfRandomMin, spfRandomMax)
        await draw(back, drawTime, cnt++)
        await drawData()
    }

    const copyData = (timestamp: DOMHighResTimeStamp) => {
        if (start == null) start = timestamp
        const elapsed = timestamp - start
        drawSync(sync, elapsed / maxTime)

        if (elapsed > maxTime) {
            start = timestamp
            copy(back, screen)
        }

        requestAnimationFrame(copyData)
    }
    requestAnimationFrame(copyData)
    drawData()
}

function doubleBuffering(spf: number, spfRandomMin: number, spfRandomMax: number) {
    let start = null
    let maxTime = spf * 1000
    const screen = document.querySelector<HTMLCanvasElement>("#screen-db")
    const front = document.querySelector<HTMLCanvasElement>("#front-db")
    const back = document.querySelector<HTMLCanvasElement>("#back-db")

    const sync = document.querySelector<HTMLCanvasElement>("#sync-db")

    let cnt = 0
    const drawData = async () => {
        let drawTime = getRandomReal(spfRandomMin, spfRandomMax)
        await draw(back, drawTime, cnt++)
        await delay(300)
        copy(back, front)
        await drawData()
    }

    const copyToScreen = (timestamp: DOMHighResTimeStamp) => {
        if (start == null) start = timestamp
        const elapsed = timestamp - start
        drawSync(sync, elapsed / maxTime)

        if (elapsed > maxTime) {
            start = timestamp
            copy(front, screen)
        }

        requestAnimationFrame(copyToScreen)
    }
    requestAnimationFrame(copyToScreen)
    drawData()
}

function tripleBuffering(spf: number, spfRandomMin: number, spfRandomMax: number) {
    let start = null
    let maxTime = spf * 1000
    const screen = document.querySelector<HTMLCanvasElement>("#screen-tb")
    const front = document.querySelector<HTMLCanvasElement>("#front-tb")
    const back1 = document.querySelector<HTMLCanvasElement>("#back1-tb")
    const back2 = document.querySelector<HTMLCanvasElement>("#back2-tb")

    const sync = document.querySelector<HTMLCanvasElement>("#sync-tb")

    let cnt = 0
    const drawData = async () => {
        let drawTime = getRandomReal(spfRandomMin, spfRandomMax)
        await draw(back1, drawTime, cnt++)
        setTimeout(() => copy(back1, front), 300)
        drawTime = getRandomReal(spfRandomMin, spfRandomMax)
        await draw(back2, drawTime, cnt++)
        setTimeout(() => copy(back2, front), 300)
        await drawData()
    }

    const copyToScreen = (timestamp: DOMHighResTimeStamp) => {
        if (start == null) start = timestamp
        const elapsed = timestamp - start
        drawSync(sync, elapsed / maxTime)

        if (elapsed > maxTime) {
            start = timestamp
            copy(front, screen)
        }

        requestAnimationFrame(copyToScreen)
    }
    requestAnimationFrame(copyToScreen)
    drawData()
}

screenTearing(2, 1 / (45 / 100), 1 / (55 / 100))
doubleBuffering(2, 1 / (40 / 100), 1 / (60 / 100))
tripleBuffering(2, 1 / (40 / 100), 1 / (60 / 100))