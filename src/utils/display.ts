import { Employee, DisplayOptions } from '../types'

export const DEFAULT_DISPLAY: DisplayOptions = {
  showId: true, showName: true, showDepartment: true, showPhoto: true,
}

export function displayLines(employee: Employee, options: DisplayOptions): string[] {
  return [options.showId ? employee.id : '', options.showName ? employee.name : '',
    options.showDepartment ? employee.department : ''].filter(Boolean)
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  if (typeof ctx.beginPath === 'function') ctx.beginPath()
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r)
    return
  }
  if (typeof ctx.moveTo === 'function' && typeof ctx.lineTo === 'function') {
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.lineTo(x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.lineTo(x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.lineTo(x, y + h - r)
    ctx.lineTo(x, y + r)
    if (typeof ctx.closePath === 'function') ctx.closePath()
  }
}

/**
 * 在 256x256 画布上绘制精致的员工抽奖名片（供 3D 场景与外观设置实时预览共用）
 */
export function paintEmployeeCard(
  ctx: CanvasRenderingContext2D,
  employee: Employee,
  options: DisplayOptions,
  primaryColor: string,
  photo?: HTMLImageElement
) {
  if (typeof ctx.clearRect === 'function') ctx.clearRect(0, 0, 256, 256)

  const name = options.showName ? employee.name.trim() : ''
  const id = options.showId ? employee.id.trim() : ''
  const dept = options.showDepartment ? employee.department.trim() : ''

  // 1. 绘制圆角底卡
  if (typeof ctx.save === 'function') ctx.save()
  drawRoundedRect(ctx, 6, 6, 244, 244, 24)
  ctx.fillStyle = primaryColor
  if (typeof ctx.fill === 'function') ctx.fill()
  else if (typeof ctx.fillRect === 'function') ctx.fillRect(0, 0, 256, 256)

  if (photo) {
    // 照片卡片：圆角裁剪 + 居中铺满 + 底部信息遮罩
    if (typeof ctx.clip === 'function') ctx.clip()
    const scale = Math.max(244 / (photo.width || 244), 244 / (photo.height || 244))
    const w = (photo.width || 244) * scale
    const h = (photo.height || 244) * scale
    ctx.drawImage(photo, (256 - w) / 2, (256 - h) / 2, w, h)

    const primaryText = name || id || dept
    const subParts = [name && id ? id : '', (name || id) && dept ? dept.slice(0, 10) : ''].filter(Boolean)
    const subText = subParts.join(' · ')

    if (primaryText) {
      const barTop = subText ? 162 : 182
      if (typeof ctx.createLinearGradient === 'function') {
        const grad = ctx.createLinearGradient(0, barTop - 16, 0, 250)
        grad.addColorStop(0, 'rgba(0,0,0,0)')
        grad.addColorStop(0.3, 'rgba(0,0,0,0.68)')
        grad.addColorStop(1, 'rgba(0,0,0,0.88)')
        ctx.fillStyle = grad
      } else {
        ctx.fillStyle = 'rgba(0,0,0,0.75)'
      }
      ctx.fillRect(6, barTop - 16, 244, 266 - barTop)

      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#ffffff'
      const mainSize = primaryText.length <= 3 ? 30 : primaryText.length <= 5 ? 26 : 22
      ctx.font = `bold ${mainSize}px "Microsoft YaHei", sans-serif`
      ctx.fillText(primaryText, 128, subText ? 204 : 222, 224)

      if (subText) {
        ctx.fillStyle = 'rgba(255,255,255,0.82)'
        ctx.font = '18px "Microsoft YaHei", sans-serif'
        ctx.fillText(subText, 128, 232, 224)
      }
    }
  } else {
    // 精致文字卡片（还原并升级 1.2.2 质感：对角光泽渐变 + 层次排版 + 底部装饰线）
    if (typeof ctx.createLinearGradient === 'function') {
      const grad = ctx.createLinearGradient(6, 6, 250, 250)
      grad.addColorStop(0, 'rgba(255,255,255,0.22)')
      grad.addColorStop(0.5, 'rgba(255,255,255,0.04)')
      grad.addColorStop(1, 'rgba(0,0,0,0.22)')
      ctx.fillStyle = grad
      if (typeof ctx.fill === 'function') ctx.fill()
    }

    // 顶部微光装饰条
    if (typeof ctx.beginPath === 'function' && typeof ctx.moveTo === 'function' && typeof ctx.lineTo === 'function' && typeof ctx.stroke === 'function') {
      ctx.beginPath()
      ctx.moveTo(76, 30)
      ctx.lineTo(180, 30)
      ctx.strokeStyle = 'rgba(255,255,255,0.22)'
      ctx.lineWidth = 2
      ctx.stroke()
    }

    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    const mainText = name || id || dept
    const hasTopBadge = Boolean(name && id)
    const bottomText = name ? dept : (id ? dept : '')

    // 顶部工号/号码胶囊标签（当同时显示姓名与工号时）
    if (hasTopBadge) {
      ctx.fillStyle = 'rgba(0,0,0,0.22)'
      if (typeof ctx.beginPath === 'function' && typeof ctx.roundRect === 'function' && typeof ctx.fill === 'function') {
        ctx.beginPath()
        ctx.roundRect(58, 42, 140, 32, 16)
        ctx.fill()
      }
      ctx.fillStyle = 'rgba(255,255,255,0.92)'
      ctx.font = 'bold 20px "Microsoft YaHei", sans-serif'
      ctx.fillText(id, 128, 58, 128)
    }

    // 中央主文字（姓名 或 纯号码）
    if (mainText) {
      ctx.fillStyle = '#ffffff'
      const len = mainText.length
      const fontSize = len <= 2 ? 68 : len <= 3 ? 54 : len <= 4 ? 44 : len <= 6 ? 36 : 28
      ctx.font = `bold ${fontSize}px "Microsoft YaHei", sans-serif`
      const mainY = hasTopBadge && bottomText ? 124 : hasTopBadge ? 138 : bottomText ? 112 : 128
      ctx.fillText(mainText, 128, mainY, 220)
    }

    // 底部部门文字
    if (bottomText) {
      ctx.fillStyle = 'rgba(255,255,255,0.78)'
      ctx.font = '22px "Microsoft YaHei", sans-serif'
      const subY = hasTopBadge ? 178 : 172
      ctx.fillText(bottomText.slice(0, 10), 128, subY, 216)
    }

    // 底部精致装饰线
    if (typeof ctx.beginPath === 'function' && typeof ctx.moveTo === 'function' && typeof ctx.lineTo === 'function' && typeof ctx.stroke === 'function') {
      ctx.beginPath()
      ctx.moveTo(64, 212)
      ctx.lineTo(192, 212)
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'
      ctx.lineWidth = 2
      ctx.stroke()
    }
  }

  if (typeof ctx.restore === 'function') ctx.restore()

  // 外层高光圆角边框
  if (typeof ctx.stroke === 'function') {
    drawRoundedRect(ctx, 6, 6, 244, 244, 24)
    ctx.strokeStyle = photo ? 'rgba(255,255,255,0.48)' : 'rgba(255,255,255,0.35)'
    ctx.lineWidth = 4
    ctx.stroke()
  }
}
