import * as THREE from 'three'

export class BlendshapeController {
  private meshes: THREE.Mesh[] = []

  constructor(
    scene: THREE.Object3D
  ) {
    scene.traverse((object) => {
      if (
        object instanceof THREE.Mesh &&
        object.morphTargetDictionary &&
        object.morphTargetInfluences
      ) {
        this.meshes.push(object)
      }
    })
  }

  setBlendshape(
    name: string,
    value: number
  ) {
    const clampedValue =
      THREE.MathUtils.clamp(
        value,
        0,
        1
      )

    for (
      const mesh of this.meshes
    ) {
      const index =
        mesh.morphTargetDictionary?.[
          name
        ]

      if (
        index !== undefined &&
        mesh.morphTargetInfluences
      ) {
        mesh.morphTargetInfluences[
          index
        ] = clampedValue
      }
    }
  }

  getBlendshapeNames(): string[] {
    const names =
      new Set<string>()

    for (
      const mesh of this.meshes
    ) {
      if (
        mesh.morphTargetDictionary
      ) {
        Object.keys(
          mesh.morphTargetDictionary
        ).forEach((name) => {
          names.add(name)
        })
      }
    }

    return Array.from(names)
  }

  reset() {
    for (
      const mesh of this.meshes
    ) {
      if (
        mesh.morphTargetInfluences
      ) {
        mesh.morphTargetInfluences.fill(
          0
        )
      }
    }
  }
}