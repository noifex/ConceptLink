import { createBrowserRouter } from "react-router-dom";
import Root from "./Root";
import ConceptDetail from "./ConceptDetail";
import LandingPage from "./pages/LandingPage";

const router=createBrowserRouter([
    {
        path:"/",
        Component:LandingPage
    },
    {
        path:"/app",
        Component:Root,
        children:[
            { index: true, element: <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>左側からConceptを選択してください</div> },
            {path:"concepts/:id",Component:ConceptDetail}
        ]
    },
]);
export {router};