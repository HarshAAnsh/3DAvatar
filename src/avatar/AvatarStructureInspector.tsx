import { useEffect } from "react";
import { useAvatarStore } from "../store/avatarStore";

export default function AvatarStructureInspector() {
  const scene = useAvatarStore((state) => state.scene);

  useEffect(() => {
    if (!scene) return;

    console.log("========== AVATAR STRUCTURE ==========");

    scene.traverse((object) => {
      console.log(
        object.type,
        "|",
        object.name,
        "|",
        object.parent?.name ?? "ROOT",
      );
    });

    console.log("======================================");
  }, [scene]);

  return null;
}
