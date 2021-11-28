
class App extends HTMLElement{
 constructor(){
	super();
	
	
	
	
 }
 connectedCallback(){
	this.render();
}
 createComponent(){
	const frag = document.createElement("div");
	frag.innerHTML = `
<x-prueba></x-prueba>
`;
	const selector = frag.querySelectorAll("*");this.setAttribute("class","app");
	return frag;
 }
 render(){
	this.replaceChildren(...this.createComponent().children);
 }
}
customElements.define("x-app" , App);
	
class Prueba extends HTMLElement{
 constructor(){
	super();
	this.text  =  "Hola prueba" 

	
	
	this.action = (e)=>{
    console.log(e.target)
};
 }
 connectedCallback(){
	this.render();
}
 createComponent(){
	const frag = document.createElement("div");
	frag.innerHTML = `
<div>
<h1>${this.text}</h1>
</div>
`;
	const selector = frag.querySelectorAll("*");this.setAttribute("class","prueba");selector[0].setAttribute("class","container"); selector[1].addEventListener("click",(e)=>{this.action(e)});
	return frag;
 }
 render(){
	this.replaceChildren(...this.createComponent().children);
 }
}
customElements.define("x-prueba" , Prueba);
	