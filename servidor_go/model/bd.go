package model

var Casas = Items{

	0: {
		Id:                 1,
		N_habitaciones:     2,
		Ascensor:           true,
		Reformado:          true,
		Aire_acondicionado: true,
		Direccion: Direccion{
			Calle:     "hernan cortes",
			CP:        46920,
			Numero:    15,
			Poblacion: "Mislata",
			Provicia:  "Valencia",
		},
		Fotos: []string{
			"src1",
			"src2",
		},
	},
}
