import { action } from "./action"
const Prueba = ()=>{

    static:text = "Hola prueba" 
    html:
        <main at:class = "prueba">
            <div at:class = "container">
             <h1 on:Click={ action(e) }>{ text }</h1>
            </div>
        </main>
    css:
        <style>
            background-image: url;
        </style>

}