import { createBrowserRouter } from "react-router-dom";
import Root from "./Root";
import ConceptDetail from "./ConceptDetail";

const router=createBrowserRouter([
    {path:"/",Component:Root,
        children:[
        //{ index: true, element: <Navigate to="/concepts" replace /> },

        //{path:"concepts",Component:ConceptList},
        {path:"concepts/:id",Component:ConceptDetail}
        ]
    },
]);
export {router};