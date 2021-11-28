package model

import (
	"fmt"
	"strconv"
)

type Item struct {
	Id                 int       `json:"id"`
	N_habitaciones     int       `json:"numero_habitaciones"`
	Ascensor           bool      `json:"ascensor"`
	Reformado          bool      `json:"reformado"`
	Aire_acondicionado bool      `json:"aire_acondicionado"`
	Direccion          Direccion `json:"direccion"`
	Fotos              []string  `json:fotos`
}
type Direccion struct {
	Calle     string `json:"calle"`
	Numero    int    `json:"numero"`
	Poblacion string `json:"poblacion"`
	CP        int    `json:"cp"`
	Provicia  string `json:"provicia"`
}
type Items []Item

func (this *Items) Post(post Item) {
	*this = append(*this, post)
	fmt.Println("post",*this)
}
func (this *Items) Delete(id string) {

	for index , value := range *this{
		number,_ := strconv.Atoi(id) 
		if value.Id == number {
			fmt.Println("deleting..>>",value.Id)
			item := *this
			if index > 0 {
				*this = append(item[:index-1],item[index:]...)
			}else if index == 0 {
					*this = append(item[:0])
				}else{
						fmt.Println("el slice no contiene esa direccion")
				}
			fmt.Println(*this)
		}
	}
}
func (this *Items) Put(id string , newPut Item){
	fmt.Println("put",*this)
	fmt.Println("nuevo:" , newPut)
	for index , value := range *this{
		number , _ := strconv.Atoi(id)
		if value.Id == number{
			if index > 0 {
				item := *this
				*this = item[:index-1]
				*this = append(*this,newPut)
				*this = append(*this,item[index:]...)
				
				}else if index == 0 {
					item := *this
					item[0] = newPut
					*this = item
					}else {
						fmt.Println("id no valido")
					}
			fmt.Println("puting..>>",*this)
		}
	}
}
func (this Items) Find(id string)( Items  , string){
	fmt.Println(this)
	res := Items{}
	var e string 
	number , err := strconv.Atoi(id)
	if err != nil {
		e = ("Id no valida !!")
	}
	for _ , value := range this {
		if value.Id == number {
			res = append(res, value)
			e = ""
		}else{
			e = ("Id no encontrada !!")
		}
	}
	return res , e
}
func ( this Items ) All() Items {
	fmt.Println(this)
	return this
}
