import React, { useEffect, useRef, useState } from 'react'
import Paint from '..'
// @ts-ignore
import exampleImg from './example.jpg'

export function TestComponent() {
  const ref = useRef<Paint>()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cursorRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLCanvasElement>(null)
  const previewBgRef = useRef<HTMLCanvasElement>(null)
  const [toolname, setToolname] = useState('')
  const [lineW, setLineW] = useState<number>(15)
  const [resultUrl, setResultUrl] = useState('')
  useEffect(() => {
    const p = new Paint(canvasRef.current!, cursorRef.current!)
    p.loadBottomImage(exampleImg)
    p.setLineWidth(15)
    setLineW(15)
    p.selectBrush()
    setToolname('笔刷')
    ref.current = p

    p.emitter.on('canvasUpdate', () => {
      if (!previewRef.current) return
      if (!previewBgRef.current) return
      const previewCanvas = previewRef.current
      const previewBgCanvas = previewBgRef.current
      const maskCanvas = p.layersManager.saveMaskCanvas(
        'rgba(0,0,0, 0)',
        [0, 0, 0, 255]
      )
      previewCanvas.width = maskCanvas.width
      previewCanvas.height = maskCanvas.height
      previewBgCanvas.width = maskCanvas.width
      previewBgCanvas.height = maskCanvas.height

      const bgCtx = previewBgCanvas.getContext('2d')!
      p.layersManager.renderBottomImage(bgCtx)
      bgCtx.fillStyle = 'rgba(0,0,0,0.5)'
      bgCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height)

      const canvasCtx = previewCanvas.getContext('2d')!
      canvasCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height)
      p.layersManager.renderBottomImage(canvasCtx)
      canvasCtx.globalCompositeOperation = 'destination-in'
      canvasCtx.drawImage(maskCanvas, 0, 0)
    })
  }, [])
  return (
    <div>
      <h3>为图片生成蒙版图</h3>
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <canvas
          width={500}
          height={500}
          style={{ width: '500px', height: '500px' }}
          ref={canvasRef}
        ></canvas>

        <div
          style={{
            position: 'relative',
            width: '500px',
            height: '500px',
          }}
        >
          <canvas
            width={500}
            height={500}
            style={{
              width: '500px',
              height: '500px',
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
            }}
            ref={previewBgRef}
          ></canvas>
          <canvas
            width={500}
            height={500}
            style={{
              width: '500px',
              height: '500px',
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              zIndex: 2,
            }}
            ref={previewRef}
          ></canvas>
        </div>

        <div
          style={{
            position: 'absolute',
          }}
          ref={cursorRef}
        ></div>
      </div>

      <p>使用鼠标滚轮，或双指缩放后，可以移动画布</p>
      <br />
      <p>当前工具：{toolname}</p>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          padding: '8px',
        }}
      >
        <p>操作栏：</p>
        <button
          onClick={() => {
            ref.current?.undo()
          }}
        >
          撤销↩️
        </button>
        <button
          onClick={() => {
            ref.current?.redo()
          }}
        >
          重做↪️
        </button>
        <button
          onClick={() => {
            ref.current?.selectBrush()
            setToolname('笔刷')
          }}
        >
          选择笔刷
        </button>
        <button
          onClick={() => {
            ref.current?.selectErase()
            setToolname('橡皮擦')
          }}
        >
          选择橡皮擦
        </button>
        <button
          onClick={() => {
            ref.current?.selectSelect()
            setToolname('移动工具')
          }}
        >
          选择移动工具（仅在画布放大后生效）
        </button>
        <div style={{ fontSize: '14px' }}>
          笔触大小：
          <input
            type="range"
            value={lineW}
            min={1}
            max={30}
            onChange={e => {
              ref.current?.setLineWidth(Number(e.target.value))
              setLineW(Number(e.target.value))
            }}
          />
        </div>

        <p>操作后，点击下方按钮⬇️可以生成蒙版图</p>
        <button
          onClick={async () => {
            const blob = (await ref.current?.saveMask()) as Blob
            if (!blob) return
            await getBase64AsPromise(blob).then(url => {
              setResultUrl(url)
            })
          }}
        >
          预览蒙版图
        </button>
      </div>

      {resultUrl && (
        <div>
          <h3>结果图预览</h3>
          <img src={resultUrl} alt="" />
        </div>
      )}
    </div>
  )
}

function getBase64AsPromise(img: File | Blob | undefined): Promise<string> {
  return new Promise((resolve, reject) => {
    if (img) {
      const reader = new FileReader()
      reader.addEventListener('load', () => {
        if (reader.result && typeof reader.result === 'string') {
          resolve(reader.result)
        }
      })
      reader.readAsDataURL(img)
    }
  })
}
