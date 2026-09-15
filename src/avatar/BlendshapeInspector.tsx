import { useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

export default function BlendshapeInspector() {
  const { scene } = useGLTF('/avatars/facecap.glb')

  useEffect(() => {
    console.log('========== AVATAR INSPECTION ==========')

    scene.traverse((object) => {
      if (
        object instanceof THREE.Mesh &&
        object.morphTargetDictionary
      ) {
        console.log('Mesh:', object.name)

        console.log(
          'Morph Target Count:',
          Object.keys(object.morphTargetDictionary).length
        )

        console.log(
          'Morph Targets:',
          Object.keys(object.morphTargetDictionary)
        )

        console.log(
          'Dictionary:',
          object.morphTargetDictionary
        )

        console.log(
          'Influences:',
          object.morphTargetInfluences
        )
      }
    })

    console.log('========================================')
  }, [scene])

  return null
}