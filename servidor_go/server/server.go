package server

import (
	"api/model"
	"mime"
	"net/http"
)
type Router struct{
	Router string
	Handle func(http.ResponseWriter, *http.Request)
}
type Config struct{
	StaticFolder string
	Port string 
	Routers []Router
	DataBase []model.Item
}

	func Init(serv Config){
		
		
		mime.AddExtensionType(".js","text/javascript")
		
		http.Handle("/",http.FileServer(http.Dir("./"+serv.StaticFolder)))
		
		for _ , value :=range serv.Routers{
			
			http.HandleFunc(value.Router,value.Handle)
		}
		
		http.ListenAndServe(serv.Port,nil)
	}


