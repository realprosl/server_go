package slice

import (
	"fmt"
	"reflect"
	"strings"
)


func Delete (s interface{}, i int ) interface{} {
	init := reflect.ValueOf(s).Slice(0,i)
	length := reflect.ValueOf(s).Len()
	if i != length{
		end := reflect.ValueOf(s).Slice(i+1,length)
		return reflect.AppendSlice( init , end ).Interface().(interface{})
	}
	return init.Interface().(interface{})
}
func Replace ( s interface{} ,add interface{},i int ) interface{}{
	len := reflect.ValueOf(s).Len()
	reflect.ValueOf(s).Index(i).Set(reflect.ValueOf(add))
	return reflect.ValueOf(s).Slice(0,len -1).Interface().(interface{})
}
func Includes ( s interface{} , c interface{}) ( bool  ){
	str := fmt.Sprintf("%v",s)
	p := fmt.Sprintf("%v",c)
	return strings.Contains(str,p)
}
func IndexOf ( s interface{} , c interface{}) ( int ){
	str := fmt.Sprintf("%v",s)
	slice := strings.Split(str," ")
	p := fmt.Sprintf("%v",c)
	for i , v := range slice{
		if v == p {
			return i
		}
	}
	return -1
}

