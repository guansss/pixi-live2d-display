
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
