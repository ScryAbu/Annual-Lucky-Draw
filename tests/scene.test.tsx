import { expect, it, vi } from 'vitest'
import ReactThreeTestRenderer from '@react-three/test-renderer'
import * as THREE from 'three'
import LotterySphere from '../src/3d/LotterySphere'
import { people } from './fixtures'

it('150 张卡片在重复父级渲染时复用纹理，卸载释放全部纹理', async () => {
  const original = HTMLCanvasElement.prototype.getContext
  const canvas = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
    if (type === '2d') return { fillRect() {}, fillText() {}, drawImage() {} } as unknown as CanvasRenderingContext2D
    return original.apply(this, [type, ...args] as Parameters<typeof original>)
  } as typeof original)
  const dispose = vi.spyOn(THREE.Texture.prototype, 'dispose')
  const pool = people(150), winners: typeof pool = []
  const renderer = await ReactThreeTestRenderer.create(<LotterySphere employees={pool} isRolling primaryColor="#6366f1" winners={winners} />)
  const sprites = () => {
    const items: THREE.Sprite[] = []
    renderer.scene.instance.traverse(object => { if ((object as THREE.Sprite).isSprite) items.push(object as THREE.Sprite) })
    return items
  }
  expect(sprites()).toHaveLength(150)
  const textures = sprites().map(s => s.material.map)
  for (let i = 0; i < 10; i++) await renderer.update(<LotterySphere employees={[...pool]} isRolling primaryColor="#6366f1" winners={winners} />)
  expect(sprites().map(s => s.material.map)).toEqual(textures)
  expect(dispose).not.toHaveBeenCalled()
  await renderer.advanceFrames(60, 1 / 60)
  expect(renderer.scene.instance.children[0].rotation.y).toBeGreaterThan(0)
  await renderer.unmount()
  expect(dispose).toHaveBeenCalledTimes(150)
  dispose.mockRestore(); canvas.mockRestore()
})
