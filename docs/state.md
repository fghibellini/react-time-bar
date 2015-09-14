
# State structure documentation

The state is implemented as an Immutable.js structure.

## Class diagram

![state class diagram](http://yuml.me/diagram/nofunky/class/[State|min;max;width;...|]action <>-[Action], [Action]^-[DraggingAction||], [Action]^-[PreviewAction|x : number|], [DraggingAction]initialCoords <>-[Coordinates|x : number; y: number|])

[editable](http://yuml.me/diagram/nofunky/class/edit/[State|min;max;width;...|]action <>-[Action], [Action]^-[DraggingAction||], [Action]^-[PreviewAction|x : number|], [DraggingAction]initialCoords <>-[Coordinates|x : number; y: number|])
