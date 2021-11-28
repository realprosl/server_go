export function html2(str,...raw){
// declaraciones
    str = str.toString();
    let objectEvents = {};
    let objectProps = [];
    let events = 0;
    let props = 0;
    let keyProp ;
    let prop ;
    let nameProp;
// buscador de eventos en un string
    const hasEvent = (nameEvent)=>{

        if(nameProp.includes(nameEvent)){

            let op1 = `${nameEvent} = @var`;
            let op2 = `${nameEvent}=@var`;
            let op3 = `${nameEvent} =@var`;
            let op4 = `${nameEvent}= @var`;
            str = str.replace(op1 ,`event = ${events}`)
                        .replace(op2,`event = ${events}`)
                        .replace(op3,`event = ${events}`)
                        .replace(op4,`event = ${events}`);
            objectEvents[events] = {name : nameEvent.toLowerCase().replace('on',''), value :raw[0]}
            events++;
            return false;
        }else{
            return true;
        }
    }
// remplazo las comas que van por defecto en la funcion y pongo un puntero pare despues acceder
    str = str.replace(/,/g,'@var')
// itero el contenido de raw con todas las variables grabadas
    raw.map(item =>{
        //console.log(typeof item , item);
        // busco el puntero 
        prop = str.match('@var');
        // grabo una cadena con el nombre de la prop del puntero
        nameProp = str.slice(prop.index-12,prop.index);
        // props transferidas por html
        if(nameProp.includes('@')){
            keyProp = nameProp.match(/@(.*)=/g).toString().replace('=','')
            objectProps.push({name:keyProp.replace('@',''), value:item})
            str = str.replace(keyProp,'props'+props)
                        .replace('@var',props)
            props++
            raw = raw.slice(1, raw.length);

        }else
        // si la varible es un string, number o objeto
        if(typeof item === 'string' || 
            typeof item === 'number' || 
            typeof item === 'object' || 
            typeof item === 'boolean'){
                if(item.children){
                    const children = Array.from(item.children)
                    str = str.replace('@var',children[0].outerHTML)
                    raw = raw.slice(1,raw.lenght)

                }else if(Array.isArray(item) 
                            && item[0].constructor.name === 'DocumentFragment'){
                    let joinElements = '';
                    item.map(item=>{
                        joinElements += item.children[0].outerHTML.replace(/"/g,'');
                    })
                    str = str.replace('@var',joinElements)
                    raw = raw.slice(1,raw.lenght)
                    
                }else{
                    let replace;
                    if(Array.isArray(item)){
                        replace = JSON.stringify(raw[0]).replace(/"/g,"'")
                        str = str.replace ('@var',`"${replace}"`)
                    }else if (typeof item === 'string'){
                        replace = raw[0]
                        str = str.replace ('@var',replace)
                    }else if (typeof item === 'number'){
                        replace = parseInt(raw[0])
                        str = str.replace ('@var', replace)
                    }else if (typeof item === 'boolean'){
                        str = str.replace('@var',raw[0])
                    }
                }
                raw = raw.slice(1, raw.length);
            
        }else
        // si es una funcion
        if(typeof item === 'function'){
// busco eventos en el string
            let res = hasEvent('onClick');
            if(res) res = hasEvent('onChange');
            if(res) res = hasEvent('onMouseOver');
            if(res) res = hasEvent('onMouseOut');
// sino lo hay 
            if(res){
                if(raw[0] != undefined){
                    
                        let valor = raw[0]();
                        // compruebo si lo que me llega es un elemento html
                        if(typeof valor === 'object' && valor.innerHTML != undefined){
                            str = str.replace('@var',valor.innerHTML);
                        }else{
                            str = str.replace('@var',valor);
                        }
                }else{
                    console.log('raw[0] es :', raw[0]);
                }
            }
            // borro la primera posicion del array raw
            raw = raw.slice(1,raw.length);
        }

    })
// borro el container y convierto el string en un elementHTML
    str = str.replace('<>','').replace('</>','');
    const container = document.createElement('div')
        container.innerHTML = str;
// busco los atributos event para añadir los eventos
    let elements = container.querySelectorAll('[event]');
    for(let item of elements){
        let position = item.getAttribute('event');
        if(objectEvents[position] != undefined){

            item.addEventListener(objectEvents[position].name,objectEvents[position].value)
        }
    }
/// tratamiento del bind para formularios

    let childrenProps = container.includesAttribute('@bind')
    if(childrenProps != undefined){
        childrenProps.forEach(item=>{
            item.addEventListener('change',(e)=>{
                let parent = item.parentNode;
                while(!parent.tagName.toLowerCase().includes('x-')){
                    parent = parent.parentNode;
                }
                let params = item.getAttribute('@bind').split('.')
                if(params.length > 1){
                    parent[params[0]][params[1]] = item.value
                }else{
                    parent[params[0]] = item.value
                }
            })
        })
        
    }
// busco los elementos que tengan objectProps

    let childrenWitchProps = container.includesAttribute('props')
        childrenWitchProps.forEach(item => {
            let attrs = (Array.from(item.attributes)).filter(attr=>{
                return attr.nodeName.includes('props')
            })
            attrs.forEach(attr => {
                let { name , value } = objectProps[attr.nodeValue]
                item.props = { ...item.props,[name]:value}
            })
        })

// creo un fragmento HTML y meto todos los hijos para ya retornar el componente
    const frag = new DocumentFragment();
    const children = Array.from(container.children);
        children.forEach(item=>{
            frag.appendChild(item)
        })
    return frag; //COMPONENTE CREADO :)
}
export function html(strAr,...propsAr){
    let str = strAr
    let props = propsAr
    let strString;
    let objAttr = []
    const replazarComasPorPuntero = ()=>{
        strString = str.toString()
        strString = strString.replaceAll(",","@var")
    }
    const crearPantillaElemento =()=>{
        const ele = document.createElement("div")
                ele.id = "container"
                ele.innerHTML = strString
        return ele
    }
    const rellenarPunterosConVar = ()=>{
        let newStr , newProps
        newStr = clone(str)
        newProps = props
        let position = 0
        for (let i = 0 ; i < props.length ; i++){
            if(typeof props[i] === "string" || typeof props[i] === "number"){
                newStr[i+1] = `${props[i]} ${str[i+1]} `
                newProps[i] = null
            }
            if (typeof props[i] === "object" && str[i].includes("@attr")){
                newStr[i] = newStr[i].replace(/@attr(.)*=/,"")
                newStr[i+1] = `data-attr = ${position} ${str[i+1]}`
                objAttr.push(newProps[i])
                newProps[i] = null
                position++
            }
        }
        str = newStr
        props = newProps
        strString = str.toString().replaceAll(",","").replace("<>","").replace("</>","")

    }
    const buscoElementosConAttr = (query)=>{
        let selectors = query.querySelectorAll("[data-attr]")
        return Array.from(selectors)
    }
    const amplioInformacionElem = (selectors)=>{
        selectors.forEach(item=>{
            let position = parseInt(item.getAttribute("data-attr"))
            let props = objAttr[position]
            for (let prop in props){
                if(prop.includes("on")){
                    let name = prop.replace("on","").toLocaleLowerCase()
                    item.addEventListener(name , props[prop])
                    delete props[prop]
                }
                if (prop.includes("bing")){
                    let nameProp = prop
                    console.log(nameProp);
                    item.addEventListener("change", ()=>{
                        let parent = item.parentNode;
                        while(!parent.tagName.toLowerCase().includes('x-')){
                            parent = parent.parentNode;
                        }
                        let{ name , value } = item
                        let nameVariable = props[prop].split(".")
                        console.log(nameVariable);
                        if( nameVariable.length > 1){
                            let obj = nameVariable[0]
                            let property = nameVariable[1]
                            if(!parent[obj])parent[obj]= {}
                            parent[obj][property] = value
                        }else{

                            parent[props[prop]] = value
                        }
                    })
                }
            }
            item.attr = objAttr[position]
            item.removeAttribute("data-attr")
        })

    }
    const creoRellenofrag = ()=>{
        const frag = new DocumentFragment();
        const children = Array.from(el.children);
            children.forEach(item=>{
                frag.appendChild(item)
            })
            return frag
    }
        replazarComasPorPuntero()
        rellenarPunterosConVar()
    let el = crearPantillaElemento() , sel = buscoElementosConAttr(el)
        amplioInformacionElem(sel)

    return creoRellenofrag()
}
export function css(str,...raw){
// transpilando str
    str = str.toString();
// insert prefix en clases y ids
    str = str.replaceAll('.','$')
                .replaceAll('$','prefix  .')
                .replaceAll('#','$')
                .replaceAll('$','prefix  #')

// insert prefix en selectores tagName
    arrayTags.forEach(item =>{
        if(str.includes(' '+item+'{') || str.includes(' '+item+':hover')){
            str = str.replaceAll(' '+item+'{','prefix  '+item+'{')
            str = str.replaceAll(' '+item+':hover','prefix  '+item+':hover')
        }
    })
    return str
}
export const renderDom = (query,element)=>{
    let name;
    if(isClass(element)){
        name = `x-${element.name.toLowerCase()}`
    }else name = element
    document.querySelector(query).appendChild(document.createElement(name))
}
export function getObservedProps(props){
    let properties = {};
    let attributes = {};
    for(let item in props){
        if(item.includes('_')){
            let newItem = item.replace('_','')
            properties = {...properties,[newItem]:props[item]}
        }else{
            attributes = {...attributes,[item]:props[item]}
        }
    }
    return { attributes , properties }
}
export class Comp{ 

constructor({styles,states,body,props}){
    this.styles = styles;
    this.states = states;
    this.body = body;
    this.props = props;
    this.render = 1;
    this.mount = false;
    this.cloned = 0;
    this.component = [];
    
// implemento estados
    if(this.states != {}){
        for(let state in states){
            this[state] = states[state];
            const name = FirstUpperCase(state)
            this[`set${name}`] = (value)=>{
                this.setState(value,state);
            };        }
        }

}

// this.states //
    setState(value,state){
        this[state] = value;
        this.states[state] = value;
        if(this.mount) this.render = this.render +1;
        if(event){
            if(event.target.getAttribute('key')){
                let key = event.target.getAttribute('key');
                this.props.id = key;
                document.getElementById(key).replaceWith(this.$(this.props))
            }else{
                document.getElementById(this.id).replaceWith(this.$(this.props))
                
            }
        }
    }
// this.render //
    $(props){
// amplio los props que viene por el componente
        if(props) this.props = {...this.props,...props};
        let component = this.body(this.props);
        this.id = component.getAttribute('id');
// inicio estado propio del componente duplicado 
        /*if(props){
            if(isNaN(parseInt(props.initial))){
                this.states[props.id]= props.initial;
            }else{
                this.states[props.id]= parseInt(props.initial);

            }
        }*/
// meto un atributo key en los elementos que contengan un evento para despues renderizar los componentes reutlizados
        if(component.querySelectorAll('[event]')){
            let child = component.querySelectorAll('[event]');
            child.forEach(item=>item.setAttribute('key',(props)?props.id:this.id))
        }
// evento componente esta cargado 
        document.addEventListener('DOMContentLoaded',(e)=>{
           
            if(document.getElementById(this.id)){
                if(this.mount) {
                    console.log('Componente reutilizando >>',this.id.toString().replace(/[0-9]*/g,'')) ;
                    this.cloned ++;
                }
                this.mount = true;
                this.component.push({
                    mount:this.mount,
                    index : this.cloned,
                    key: (props)?props.id:this.id,
                })
            }
            console.log('Component montado >> ',(props)?props.id:this.id);
        })
        let htmlCollection ;
        if(component.children.length == 0){
            htmlCollection = [component];
        }else{
            htmlCollection = component.children
        }
// comprobar si hay componentes custom 
    for(let item of htmlCollection){
        
        if(item.constructor.toString().includes('Unknown')){
            let name = (FirstUpperCase(item.tagName.toLowerCase()));
            
            // compruebo si hay una funcion o clase con este nombre para remplazarla
            if(this.props[name]){
                // saco los props del tag component para pasarlos al componente clase
                let attrs = item.attributes;
                let props = {};
                for(let i = 0 ; i < attrs.length ; i++){
                    let value = (attrs[i].nodeValue);
                    let name = (attrs[i].name);
                    props = {...props,[name]:value}
                }
                ///
                if(this.props[name].$){
                    let newItem = this.props[name].$(props);
                    item.replaceWith(newItem);
                }else{
                    item.replaceWith(this.props[name](props));
                }
            }
        }

    }
   

    
        return component;
    }
}
export class Pro extends HTMLElement {

    constructor(){
       super();
       this.mount = false; 
       const { attributes , properties } = getObservedProps(this.constructor.attr)
       this.states = attributes;
       this.attr = properties;
       this.event = this.constructor.listen;
       this.typeEvent = this.constructor.typeEvent || 'send';
       this.styles = this.constructor.styles || '';
    
    // creo un evento escuchador para comunicar los hijos con los padres
               if(this.event != undefined){
                   this.addEventListener(this.typeEvent,this.event)
               }
    // creo funcion getter para los estados
               if(this.states != undefined){
       
                   const props = this.states;
                   let replace;
                   for(let item in props){
                       const atr = this.getAttribute(item);
                       if(props[item] === undefined)console.log('undefined>>>>>>');
                       if(atr === undefined)console.log('undefined>>>>>')
                       if(atr != undefined && atr != null){
                           
                           this[item] = toObject(atr) 
                       }else{
                           this[item] = props[item]
                       }
                       item = FirstUpperCase(item);
           
                       this['set'+item] = (value)=>{
                           this.setAttribute(item,toString(value));// reparar toString ////
                       }
                   }
               }
    // creo funcion getter para las props no escuchables
               if(this.attr != undefined){
                   for(let item in this.attr){
                       this[item] = this.attr[item]
                       this[`set${FirstUpperCase(item)}`] = (value)=>{
                            this[item] = value;
                            this.attr[item] = value;
                            this.render();
                       }
                   }
               }
    // metodo retorno del this de la instacia desde el constructor
        this.constructor.getThis = ()=>{
            return this;
        }
    // implemento el css en el libro de  stylos con el prefix 
        if(this.styles != undefined && this.styles != ''){
            const styles = this.styles.replaceAll('prefix',this.tagName.toLowerCase());
            document.querySelector('#root-styles').innerHTML += styles;
        }

            
        
       
    }

    connectedCallback(){
        this.onMount();
        this.render()
        this.mount = true;
    }

    static get observedAttributes(){
        let states;
        if(this.attr != undefined){
            states = Object.keys(this.attr);
        }else{
            states = ['']
        }
        return [...states];
    }

    attributeChangedCallback(atributo , viejoValor,nuevoValor ){
        if(nuevoValor === undefined && nuevoValor === ''){
            console.log('valor vacio o nulo');
        }
        if(viejoValor != nuevoValor){
            this[atributo] = toObject(this.getAttribute(atributo))
            this.render();
    }
    }

    render(){
        this.innerHTML = '';
        this.appendChild(this.body())
    }

    static define(){
        console.log('componente definido',this.name);
        customElements.define(`x-${this.name.toLowerCase()}`,this)
    }

    send( detail , type = 'send' ){
       this.dispatchEvent(new CustomEvent(type,{bubbles:true,detail}))
    }

    onMount(){

    }

    body(){
        return (html`<div>Vacio</div>`)
    }

}
export const assets = (()=>{
// global
    window.useGet = async function( url , callback ){
        const res = await fetch(url);
        callback(await res.json());
    }
    window.clone = function(dato){
        return JSON.parse(JSON.stringify(dato))
    }
    window.setAttribute = function(query,props){
    if(query && props){
        let el;
        if(typeof query === 'string'){
           el = document.querySelector(query)
        }
        if(typeof query === 'function'){
            let name = `x-${query.name.toLowerCase()}`
            el = document.querySelector(name)
        }
        if(el){
             for(let item in props){
                 if(typeof props[item] != 'function') el.setAttribute(item,props[item])
             }
        }else{
            console.error('Error:Elemento nulo o undefined');
        }
    }
    }
    window.appendChildIn = function( tag , append , props ){
    let el;
    let child ;
        if(typeof tag === 'string'){
            el = document.querySelector(tag)
        }
        if(typeof tag === 'function'){
            console.log(tag.name);
            let tagName = `x-${tag.name.toLowerCase()}`
            el = document.querySelector(tagName)
        }
        if (tag.innerHTML != undefined){
            el = tag
        }
            if(el){
                if(append){ 
                    
                    if(typeof append === 'string'){
                        child = document.createElement(append)
                    }
                    if(typeof append === 'function'){
                        let name = `x-${append.name.toLowerCase()}`
                        child = document.createElement(name)
                    }
                    if(append.innerHTML){
                        child = append
                    }
                    if(props){
                        if(props.forEach){
                            props.forEach(( item , value )=>{
                                if(typeof value != 'function') child.setAttribute(item,value)
                            })
                        }else{
                            for(let item in props){
                                if(typeof props[item] != 'function') child.setAttribute(item,props[item])
                            }
                        }
                    }
                    el.appendChild(child)
                }
            }else{
                console.log('Error:Elemento null o undefined');
            }
        return child    
    
    }
    window.isEmpty = (value)=>{
        if(typeof value === 'object'){

            for(let item in value){
                if(value.hasOwnProperty(item)){
                    return false;
                }
            }
            return true
        }else{
            if(value === undefined || value === null){
                return true
            }else{
                return false
            }
        }
    }
    window.FirstUpperCase = (str)=>{
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    window.isObjectString = (str)=>{
        if(str != undefined){
            str = str.replaceAll(' ','');
     
            const firstCase = str.charAt(0);
            const secondCase = str.charAt(1);
            const preEndCase = str.charAt(str.length -2);
            const endCase = str.charAt(str.length - 1);
    
            if((firstCase === '[' && endCase === ']') 
                || (firstCase === '{' && endCase === '}')
                || (secondCase === '{' && preEndCase === '}')
                || (secondCase === '[' && preEndCase === ']')
                ){
                return true;
            }else{
                return false;
            }
        }
    }
    window.toString = (str)=>{
        if(typeof str === 'number' || typeof str === 'boolean'){
            str = str
        }else
        if(typeof str != 'string'){
               str = `"${JSON.stringify(str).replace(/"/g,"'")}"`;
        }
        return str
    }
    window.toObject = (str) => {
        if(str != undefined && str != null ){
            if(isObjectString(str)){
                //console.log('object');
                str = str.replace(/"/g,'').replace(/'/g,'"');
                str = JSON.parse(str);
    
            }else if(!isNaN(str)){
                //console.log('number');
                str = parseInt(str.replace(/"/g,''))
    
            }else if (str.includes('true') || str.includes('false')){
                //console.log('boolean');
                if(str.toString().includes('true')) str =  true;
                if(str.toString().includes('false')) str =  false;
    
            }else{
               // console.log('string');
            }

        }
        return str
    }
    window.isAttribute = (str) =>{
        str = str.replace(/ /g,'');
        let index = str.indexOf('@var')
        let char = str[index-1]
        if(char === '>') return false
        if(char === '=') return true
    }
    window.isString = (value)=>{
        if(typeof value === 'string')return true
        return false
    }
    window.isElement = (value)=>{
        if(value.innerHTML != undefined) return true
        return false
    }
    window.isArray = (value)=>{
        if(Array.isArray(value))return true
        return false
    }
    window.isObject = (value)=>{
        if(typeof value === 'object' && !Array.isArray(value)) return true
        return false
    }
    window.isFunction = (value)=>{      
        if(typeof value === 'function') return true
        return false
    }
    window.isClass = (value)=>{
        let str = value.toString();
        if(str.includes('class')) return true
        return false
    }
// metod HTMLElement
    Object.defineProperty(HTMLElement.prototype, 'brothers',{
        get : function(){
            let brother = Array.from(this.parentNode.children)
            let newBrother = []
            brother.forEach( item =>{
                if( item.outerHTML !== this.outerHTML){
                    newBrother.push(item)
                }
            })
            return newBrother
        }
    })
    HTMLElement.prototype.setAttributes = function(props){
        if(props && typeof props === 'object'){
            for(let item in props){
                if(typeof props[item] != 'function'){
                    this.setAttribute(item,props[item])
                }
            }
        }else{
            console.error('Error:Necesito un objeto !!');
        }
    }
    HTMLElement.prototype.to = function( query ){
        if(isString(query)){
            if(query === 'parent') return this.parentNode
            let resChildren = null;
            let children = Array.from(this.parentNode.children)
            if(children.length > 0){
                children.forEach(item=>{
                    if(item.tagName.toLowerCase() === query 
                        || item.getAttribute('id') === `${query.replace('#','')}`
                        || item.getAttribute('class') === `${query.replace('.','')}`){
                            resChildren =  item;
                        }
                        
                })
            }
            if(resChildren) return resChildren;
            return this.closest(query)
        }
        if(isFunction(query)){
            let name = `x-${query.name.toLowerCase()}`;
            return this.closest(name)
        }
        if(isElement(query)){
            return query
        }
    }
    HTMLElement.prototype.includesAttribute = function( str ){
        let res = [];
        let childrenAll = Array.from(this.querySelectorAll('*'))
        childrenAll.forEach(item=>{
            let attrs = Array.from(item.attributes)
            attrs.forEach(attr=>{
                if(attr.name.includes(str)){
                    res.push(item)
                }
            })
        })
       return res     
    }

// metod String
    String.prototype.clean = function(){
       return this.replace(/ /g,'').replace(/\n/g,'');
    }
    String.prototype.isObject = function(){
        if(this != undefined){
            let str = this.replaceAll(' ','');
     
            const firstCase = str.charAt(0);
            const secondCase = str.charAt(1);
            const preEndCase = str.charAt(str.length -2);
            const endCase = str.charAt(str.length - 1);
    
            if((firstCase === '[' && endCase === ']') 
                || (firstCase === '{' && endCase === '}')
                || (secondCase === '{' && preEndCase === '}')
                || (secondCase === '[' && preEndCase === ']')
                ){
                return true;
            }else{
                return false;
            }
        }
    }
    String.prototype.toObject = function (){
        let str = this;
        if(this != undefined && this != null ){
            if(this.isObject()){
                // console.log('object');
                str = str.replace(/"/g,'').replace(/'/g,'"');
                str = JSON.parse(str);
    
            }else if(!isNaN(str)){
               // console.log('number');
                str = parseInt(str.replace(/"/g,''))
    
            }else if (str.includes('true') || str.includes('false')){
               // console.log('boolean');
                if(str.toString().includes('true')) str =  true;
                if(str.toString().includes('false')) str =  false;
    
            }else{
               // console.log('string');
            }
    
        }
        return str
    }
    String.prototype.outMarks = function(){
        return this.replaceAll('"','').replaceAll("'",'')
    }
    String.prototype.hasEvent = function(typeEvent){
        let str = this.toLowerCase();
        let res = false;
        if(typeEvent === undefined){
            const events = ['onclick','ondblclick','onmousedown','onmouseenter','onmouseleave','onmousemove','onmouseover','onmouseout','onmouseup','contextmenu','onkeydown','onkeypress','onkeyup','onfocus','onblur','onchange','onselect','onsubmit','onreset','onload','onunload','onresize']
            events.forEach(item=>{
                if(str.includes(item)) res = true
            })
        }else{
            if(str.includes(typeEvent.toLowerCase())) res = true
        }
        return res;
    }
    String.prototype.whatEvent = function(){
        let str = this.toLowerCase();
        let res = null;
        const events = ['onclick','ondblclick','onmousedown','onmouseenter','onmouseleave','onmousemove','onmouseover','onmouseout','onmouseup','contextmenu','onkeydown','onkeypress','onkeyup','onfocus','onblur','onchange','onselect','onsubmit','onreset','onload','onunload','onresize']
       
        events.forEach(item=>{
                if(str.includes(item)) res = item.replace('on','');
        })
      
        return res;
    }
    String.prototype.addEvent = function( el , callBack ){
        if(this.hasEvent()){
            const event = this.whatEvent()
            if(el && callBack){
                el.addEventListener(event,callBack);
            }else{
                console.log('Error : parametos nulos o undefined !!');
            }
    
        }
    }
// metodos array

    Array.prototype._push = function (obj){
        if(isObject(obj)){
            if(clone !== undefined){
                this.push(clone(obj));
            }else{
                this.push(JSON.parse(JSON.stringify(obj)))
            }
        }
        return this
    }
// metod Object
    window.$ = function(obj){
        class $Object extends Object{
            constructor(){
                super()
            }
            toString(){
                let str = this;
                if(typeof str != 'string'){
                       str = `"${JSON.stringify(str).replace(/"/g,"'")}"`;
                }
                return str
            }
            includes(str){
                let res = false;
                this.forEach((item , value)=>{
                    if(typeof value === 'number') value = value.toString();
                    if(value.includes(str)) res =  true;
                })
                return res
            }
            forEach(callBack){
                for(let item in this){
                    if(typeof this[item] !== 'function'){
                        callBack(item ,this[item])
                    }
                }
            }
            isEmpty(){
                for(let item in this){
                    if(this.hasOwnProperty(item)){
                        return false;
                    }
                }
                return true    
            }
        }
        let newObj = new $Object();
        for(let item in obj){
            newObj[item]=obj[item]
        }
        
        return newObj
    }
})()                        
let tagsNames = "a,abbr,address,area,artic,aside,audio,b,base,bdi,bdo,blockquote,body,br,button,canvas,caption,cite,code,col,colgroup,colgroup,command,datalist,dd,del,details,dfn,dialog,div,dl,dt,em,embed,fieldset,figcaption,figure,footer,form,h1,h2,h3,h4,h5,h6,head,header,hgroup,hr,html,i,iframe,input,ins,kbd,keygen,label,legend,fieails,li,link,map,mark,menu,meta,meter,nav,noscript,objet,ol,optgroup,option,output,param,pre,progress,q,rp,rt,ruby,s,samp,script,section,select,small,source,span,strong,style,sub,summary,sup,t,tbody,td,textarea,tfoot,th,thead,tim,title,tr,track,ul,var,video,wbr";
const arrayTags = tagsNames.split(',')
