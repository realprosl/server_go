package parser

import (
	"fmt"
	"io/ioutil"
	"regexp"
	"strconv"
	"strings"
	"sync"
)

// variables globales
var rutina sync.WaitGroup
var Path string
type tag struct {
	open string
	close string
	index int
}
type attr struct {
	tipo string
	name string
	value string
	position int
}
type inner struct{
	value string
	position int
}
type tags []tag
type attrs []attr
type headers []string
type inners []inner
// assets
func trim( s []string )[]string {
	for i , v := range s{
		if len(v) == 0{
			if i == 0 {
				s = s[i+1:]
 			}else{
				s = append(s[:i-1] , s[i:]...)
			}
		}	
	}
	return s
}
func renove( s []string , str string) (res []string) {
	for _ , v := range s{
		if !strings.Contains(v, str){
			res = append(res, v)	
		}
	}
	return 
}
func (tg *tags) sort (){
	v := *tg
	for i := 0 ; i < len(*tg) ; i++{
		min := v[i]
		for j := i+1 ; j < len(*tg) ; j++ {
			if v[j].index < v[i].index {
				min = v[i]
				v[i] = v[j]
				v[j] = min
			}
		}
	}
	*tg = v
}
func SetPatch (path string)string{
	Path = path
	return path
}
func GetFolder(url string , ele *[]string ){
	folder, err := ioutil.ReadDir(url)
	if err != nil {
		panic(err)
	}
	//fmt.Println("")
	//fmt.Println("Folder >> ",url)
	//fmt.Println("-------------------------------------------")
	for _, v := range folder{
		if strings.Contains(v.Name(),"x-") && !v.IsDir(){
			//fmt.Printf(v.Name())
			//fmt.Println("-- componente")
			*ele = append(*ele, url[6:]+"/"+v.Name())
		}else if strings.Contains(v.Name(),"x-") && v.IsDir(){
			GetFolder(Path + v.Name() , ele )
		}
	}
}
// funciones para crear classe
func GetFile(name string)string {
	file, err := ioutil.ReadFile(name)

	if err != nil {
		fmt.Println(err)
	}
	return string(file)	
}
func GetImports( file string , url string  , m *string ){
	defer rutina.Done()
	type impor struct{
		names []string
		from string
		value []string
	}
	relative := Path 
	var impors []impor
  
	// acoto busqueda
	i_const := strings.Index( file , "const")
	// limpio string
	if i_const != -1 {
		file = strings.Trim(file[:i_const] , "\n\t ")
	}
	// get relative
	func (){
		i_folder := strings.LastIndex( url , "/")
		relative += url[:i_folder +1 ]
	}()
	// slice imports 
	func(){
		imports := strings.Split( file , "\n")
		for _ , v := range imports {
			open_names := strings.Index( v , "{")+1
			close_names := strings.Index( v , "}")
			index_from := strings.Index( v , "from")+ len("from")
			if open_names == -1 || close_names == -1 || index_from == -1 {
				continue
			}
			names := strings.Split(v[open_names+1 :close_names], ",")
			from := strings.Trim(v[index_from:] , ` "./\n`)
			impors = append(impors, impor{names:names,from: from ,})
		}
	}()
	// get value GetImports
	func (){
		for i , v := range impors{
			path := fmt.Sprintf("%s%s.js",relative, v.from[:len(v.from)-2])
			f := GetFile(path)
			for _ , name := range v.names{

				name = strings.ReplaceAll(name , " " , "")
				if strings.Contains( f , name ){
					open := strings.Index(f, name)
					close := strings.Index( f , "}")
					impors[i].value = append(impors[i].value , f[open:close+1])
					*m += `this.`+ f[open:close+1]+`;`
					f = f[close+1:]
				}
			}
		}
	}()
	return 
}
func GetName( file string , name *string){
	defer rutina.Done()
	r := regexp.MustCompile(`const(.)+= \(`)

	nameSlice := r.FindAllString(file,1)
	*name = strings.Replace(nameSlice[0],"const","",1)
	*name = strings.Replace(*name,"=","",1)
	*name = strings.Replace(*name,"(","",1)
	*name = strings.ReplaceAll(*name ," " , "")

	return 
}
func GetAttr( f string , o bool )map[string]string{
	var r *regexp.Regexp
	if o  {
		r = regexp.MustCompile(`static:(.)+=(.)+`)
	}else{ 
		r = regexp.MustCompile(`state:(.)+=(.)+`)
	}
	varSlice := r.FindAllString(f , 10)
	react := make(map[string]string)
	for _ , v := range varSlice {
		res := strings.Split( v , "=" )
		res[0] = strings.Replace(res[0], "static:" , "" , 1)
		res[0] = strings.Replace(res[0], "state:" , "" ,1)
		react[res[0]] = res[1]
	}
	return react
}
func GetSetterAttr( attr map[string]string , str *string){
	defer rutina.Done()
	for i , _ := range attr {
		item := strings.ReplaceAll(i , " " , "")
		item2 := strings.Title(item)
		*str += fmt.Sprintf(`
this["set%s"] = (value)=>{
	this["%s"] = value
	this.render();
};
		` ,item2,item)
	}
	return 
}
func GetBody ( f string , op int )(str string){
// html
	if op == 0{

		html_open := strings.Index( f , "<main" )
		html_close := strings.Index( f , "</main>" )
		str = f[ html_open : html_close+7 ]
		str = strings.ReplaceAll( str , "{" , "${ this.")
		str = strings.ReplaceAll( str , "\t" , "")
		str = strings.ReplaceAll( str ," " , "")
		str = fmt.Sprintf("`%s`",str)
	}
// css
	if op == 1 {

		css_open := strings.Index( f , "<style>" )
		css_close := strings.Index( f , "</style>" )
		str = f[ css_open +7: css_close ]
		str = strings.ReplaceAll( str , "{" , "${ this.")
		str = strings.ReplaceAll( str ," " , "")
		str = fmt.Sprintf("`%s`",str)
	}

	return 
}
func GetTags( h string )( tags ){
	r := regexp.MustCompile(`</(.)+>`)
	m := r.FindAllString( h , len(h)/10 )
	t := make([]tag,len(m))
	for i , v := range m{
		t[i].close = v
		t[i].open = v[:1]+ v[2:]
		t[i].index = strings.Index(h , t[i].open[1:len(t[i].open)-1])
	}
	
	return t
}
func  GetInnerTxt( h string )( inners inners ) {
	s := strings.Split(h[1:len(h)-1], "<")
	s = trim(s)
	s = renove(s ,"/")
	for i , v := range s{
		index := strings.Index(v , ">")
		s[i] = v[index:]
		s[i] = strings.TrimSpace(s[i]) 
		inner := inner{value: s[i][1:] , position: i}
		if len(s[i]) > 1 {
			inners = append(inners,inner)
		}
	}
	return
}
func GetHeader( h string )( header headers ){
	s := strings.Split(h[1:len(h)-1], ">")
	for _, v := range s {
		v = strings.TrimSpace(v)
		if !strings.Contains(v , "/"){
			v = fmt.Sprintf("%s>" ,v)
			if len(v) > 1 {
				header = append(header, v)
			}
		}
	}
	return 
}
func (s headers ) GetAttr()( a attrs ){
	for  index , v := range s{
		if strings.Contains(v, "at:"){
			r := regexp.MustCompile(`at:[\w]+="[\w]+"`)
			m := r.FindAllString(v , len(v)/10)
			for i , v := range m {
				m[i] = v[3:]
			}
			for _ , v := range m {
				
				s := strings.Split(v, "=")
				var A attr
				A.tipo = "attributes"
				A.name = s[0]
				A.value = s[1]
				A.position = index
				a = append(a, A)
			}
		}
		if strings.Contains(v, "on:"){
			r := regexp.MustCompile(`on:(.)+\)\}`)
			m := r.FindAllString(v , len(v)/10)
			if len(m) == 1 && strings.Count(m[0],"on:") > 1 {
				m = strings.Split(m[0], "on:")[1:] 
			}else{
				for i , v := range m {
					m[i] = v[3:]
				}
			}
			for _ , v := range m {
				
				s := strings.Split(v, "=")
				var A attr
				A.tipo = "event"
				A.name = strings.ToLower(s[0])
				A.value = strings.Replace(strings.Replace(s[1] , "${" ,"" ,1 ) , "}" ,"" ,1)
				A.position = index
				a = append(a, A)
			}
		}
		if strings.Contains(v, "bin:"){
			r := regexp.MustCompile(`bin:[\w]+="[\w]+"`)
			m := r.FindAllString(v , len(v)/10)
			for _ , v := range m {
				
				s := strings.Split(v, "=")
				s2 := strings.Split(s[0] , ":")
				var A attr
				A.tipo = s2[0]
				A.name = s2[1]
				A.value = s[1]
				A.position = index
				a = append(a, A)
			}
		}
	}
	return
}
func (a attrs ) GetJsString(str *string ){
	defer rutina.Done()
	selector := `const selector = frag.querySelectorAll("*");`
	*str += selector
	for _ , v := range a {
		//fmt.Println(v)
		if v.position == 0 {
			if v.tipo == "event"{
				event := `this.addEventListener("`+ v.name + `",(e)=>{` + v.value + `});`	
				*str += event
			}
			if v.tipo == "attributes"{
				attribu := `this.setAttribute("`+ v.name + `",` + v.value + `);`
				*str += attribu
			}
			if v.tipo == "bin"{
				bing := `this.addEventListener("change",()=>{this.`+ v.name +`.`+ v.value[1:len(v.value)-1] + ` = this.value });`
				*str += bing
			}
			
		}else{
			if v.tipo == "event"{
				if  strings.Contains(v.value ,"window."){
					v.value = strings.Replace(v.value , "this.window." ,"", 1)
				}
				event := ` selector[`+ strconv.Itoa(v.position-1) +`].addEventListener("`+ v.name +`",(e)=>{`+ v.value +`});`	
				*str += event
			}
			if v.tipo == "attributes"{
				attribu := `selector[`+ strconv.Itoa(v.position-1) +`].setAttribute("`+ v.name +`",`+ v.value +`);`
				*str += attribu
			}
			if v.tipo == "bin"{
				bing := `selector[`+ strconv.Itoa(v.position-1) +`].addEventListener("change",()=>{this.`+ v.name +`.`+ v.value[1:len(v.value)-1] + `= selector[`+ strconv.Itoa(v.position-1) +`].value });`
				*str += bing
			}
		}
	}
	return 
}
func GetComposition ( h string  , str *string ){
	defer rutina.Done()
	header := GetHeader( h )
	tgs := GetTags( h )
	tgs.sort()
	for i , tg := range tgs {
		tg_trim := tg.open[1:len(tg.open)-1]
		if tg_trim  == "main"{
			h = "`" + h[len(header[i])+1:len(h)-8] + "`"
		}else{

			header[i] = strings.Replace(header[i],tg_trim ,"",1 )
			header[i] = header[i][1:len(header[i])-1]
			h = strings.Replace( h , header[i] , "" , 1)
		}
	}
	*str = h 
	return 
}
func ParseAttr (attr map[string]string , str *string ){
	defer rutina.Done()
	for i , v := range attr{
		*str += fmt.Sprintf("this.%s = %s\n", i , v )
	}
	return
}
func Build_class ( url_in string , save *string){
	// leo file
	file := GetFile( Path + url_in )
	// var
	var name string
	var attr_reactivos string
	var attr_normales string
	var setters string
	var set_attrs string
	var comp string
	var imports string
	//rutines
	rutina.Add(7)
	// cuerpo clase
	go GetImports( file  , url_in , &imports )
	go GetName( file , &name )
	go ParseAttr( GetAttr(file , true ) , &attr_reactivos )
	go GetSetterAttr(GetAttr(file , false), &setters )
	go ParseAttr( GetAttr(file , false ), &attr_normales )
	// body
	
	go GetHeader( GetBody(file , 0) ).GetAttr().GetJsString(&set_attrs)
	go GetComposition( GetBody(file , 0), &comp )
	rutina.Wait()
	*save += `
class `+ name +` extends HTMLElement{
 constructor(){
	super();
	`+ attr_reactivos +`
	`+ attr_normales +`
	`+ setters +`
	`+ imports +`
 }
 connectedCallback(){
	this.render();
}
 createComponent(){
	const frag = document.createElement("div");
	frag.innerHTML = `+ comp +`;
	`+ set_attrs +`
	return frag;
 }
 render(){
	this.replaceChildren(...this.createComponent().children);
 }
}
customElements.define("x-`+ strings.ToLower(name) +`" , `+ name +`);
	`
}
func Save ( url string , content string ){
	ioutil.WriteFile(url , []byte(content) ,0644)
	fmt.Println("Coponente creado y transferido :D")
}
