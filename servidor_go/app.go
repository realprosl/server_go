package main

import (
	"api/model"
	"api/parser"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
)
func all (w http.ResponseWriter, r *http.Request){
	json.NewEncoder(w).Encode(model.Casas.All())
}
func get (w http.ResponseWriter, r *http.Request){
	id := r.URL.Query().Get("id")
	res , err := model.Casas.Find(id)
	if err != "" {
		fmt.Fprintf( w, err )
	}
	json.NewEncoder(w).Encode(res)
}
func post (w http.ResponseWriter, r *http.Request){
	if r.Method == "POST" {
		var req model.Item
		reqBody,_ := (ioutil.ReadAll( r.Body ))
		err :=json.Unmarshal(reqBody,&req)
		if err  != nil {
			fmt.Println("ERROR:s",err)
		}
		req.Id = len(model.Casas) +1 
		model.Casas.Post(req)
		json.NewEncoder(w).Encode(model.Casas)
	}else{
		fmt.Fprintf(w,"Tienes que acceder por POST")
	}
}
func delete (w http.ResponseWriter, r *http.Request){
	if r.Method == "DELETE" {
		id := r.URL.Query().Get("id")
		model.Casas.Delete(id)
		json.NewEncoder(w).Encode(model.Casas)
	}else{

		fmt.Fprintf(w , "Tienes que acceder por DELETE")
	}
}
func put (w http.ResponseWriter, r *http.Request){
	if r.Method == "PUT" {
		id := r.URL.Query().Get("id")
		var newPut model.Item
		reqBody,_ := (ioutil.ReadAll( r.Body ))
		err :=json.Unmarshal(reqBody,&newPut)
		if err  != nil {
			fmt.Println("ERROR:s",err)
		}
		model.Casas.Put(id,newPut)
		json.NewEncoder(w).Encode(model.Casas)
	}else{
		fmt.Fprintf(w , "Tienes que acceder por PUT")

	}
}


func main() {
		

	var files_ele []string
	var content string
	parser.GetFolder( parser.SetPatch("./src/") , &files_ele )
	for _, file := range files_ele {
		fmt.Println(file)
		parser.Build_class(file , &content)
	}
	parser.Save("./build/index.js",content)
	/*
	serv := server.Config{
		StaticFolder : "build",
		Port: ":3000",
		Routers:[]server.Router{
			0:{
				Router : "/all",
				Handle :all,
			},
			1:{
				Router: "/get",
				Handle : get,
			},
			2:{
				Router:"/post",
				Handle: post,
			},
			3:{
				Router:"/delete",
				Handle : delete,
			},
			4:{
				Router:"/put",
				Handle: put,
			},
		},
	}

	server.Init(serv)
	*/
}