<style>
.md-sidebar--secondary {
  display: none !important;
}

.md-content code {
  font-size: .72em !important;
}
</style>

## Main Components

```
                                                               Live2DModel
                                                                    |
                    _________________________________________ InternalModel ______________________________________________
                   /                     |                          |                          |                          \
Abstraction:  (core model)          ModelSettings             MotionManager             ExpressionManager          FocusController
              |                     |                         |                         |
Cubism 2:     |-Live2DModelWebGL    |-Cubism2ModelSettings    |-Cubism2MotionManager    |-Cubism2ExpressionManager
              |                     |                         |                         |
Cubism 4:     |-CubismModel         |-Cubism4ModelSettings    |-Cubism4MotionManager    |-Cubism4ExpressionManager
```

## Model Creation Procedure

```
                                                                               Live2DModel
                                                                                    ^
                                                                                    |
                   Live2DModel.fromSync(source)                                  "load"
                 ______________|________________                              ______|______
                /              |                \                            /             \
               v               v                 v                          |             "ready"
            (source)        (source)          (source)     ________________ | ______________|__________________________
               |               |                 |        /            _____|_____                   |                 \
               v               v                 v       |            /           \                  |                  |
artifacts:    URL         settingsJSON          ModelSettings       Pose         Physics          Texture[]       InternalModel
               |           ^         \           ^        \          ^             ^                 ^                  ^
               |          /           \          |         \         |            /                  |                  |
events:        | "settingsJSONLoaded"  \  "settingsLoaded"  \  "poseLoaded"  "physicsLoaded"  "textureLoaded"     "modelLoaded"
               v        /               v        |           v       |          /                    |                  |
middlewares:  urlToJSON()     ~~>     jsonToSettings()   ~~>   setupOptionals()   ~~>   setupLive2DModel() ~~> createInternalModel()
```
