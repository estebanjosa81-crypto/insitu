"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { type Rol } from "@/src/api/services/app/rol.service";
import { Edit, Trash2, Plus, Shield, Users, Search, MoreVertical, ShieldCheck } from "lucide-react";

interface RolesViewProps {
  roles: Rol[];
  setModalRol: (value: any) => void;
  handleEliminarRol: (rol: Rol) => void;
}

export function RolesView({
  roles,
  setModalRol,
  handleEliminarRol,
}: RolesViewProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRoles = roles.filter(rol =>
    rol.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header & Actions Row */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-2 w-10 bg-blue-600 rounded-full" />
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight leading-none">Arquitectura de Seguridad</h2>
          </div>
          <p className="text-xs font-medium text-slate-400 ml-13">Definición de jerarquías y privilegios sistémicos</p>
        </div>
        <Button
          onClick={() => setModalRol({ isOpen: true, rol: undefined })}
          className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-8 py-7 rounded-2xl shadow-xl shadow-slate-200 transition-all hover:scale-105 active:scale-95 text-sm gap-3"
        >
          <Plus className="h-5 w-5" />
          Desplegar Nuevo Rol
        </Button>
      </div>

      {/* Search & Statistics Bar */}
      <div className="flex flex-col xl:flex-row gap-6 items-center">
        <div className="relative group flex-1 w-full">
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
          </div>
          <Input
            type="text"
            placeholder="Interrogar repositorio de roles..."
            className="pl-14 py-8 bg-slate-50/50 border-2 border-slate-100 rounded-[1.8rem] text-sm font-bold focus-visible:ring-blue-600/5 focus-visible:border-blue-600 transition-all placeholder:text-slate-400 placeholder:text-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-4 bg-white px-8 py-3 rounded-[1.5rem] border-2 border-slate-100 shadow-sm whitespace-nowrap">
           <div className="flex -space-x-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-8 w-8 rounded-xl border-2 border-white bg-slate-100 flex items-center justify-center shadow-sm">
                   <Users className="w-3.5 h-3.5 text-slate-400" />
                </div>
              ))}
           </div>
           <div className="h-10 w-px bg-slate-100" />
           <div>
              <p className="text-xs font-medium text-slate-400 leading-none mb-1">Capa de Seguridad</p>
              <p className="text-sm font-bold text-slate-900">{roles.length} Definiciones</p>
           </div>
        </div>
      </div>

      {/* Content Grid */}
      {filteredRoles.length === 0 ? (
        <div className="bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[4rem] p-24 text-center animate-in zoom-in duration-500">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 bg-blue-500/10 blur-2xl rounded-full animate-pulse" />
            <div className="relative h-24 w-24 bg-white rounded-[2rem] flex items-center justify-center shadow-xl border border-slate-100 group-hover:scale-110 transition-transform">
              <ShieldCheck className="h-10 w-10 text-slate-200" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">Núcleo de Seguridad Vacío</h3>
          <p className="text-xs font-medium text-slate-400 max-w-sm mx-auto leading-relaxed">
            {searchTerm ? `No se detectaron roles bajo el parámetro "${searchTerm}"` : "El sistema opera bajo una configuración base. Use el botón superior para escalar privilegios."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredRoles.map((rol) => (
            <div
              key={rol.id}
              className="group relative bg-white border-2 border-slate-100 rounded-[2.8rem] p-8 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-200/20 hover:border-blue-600/30 overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-125 group-hover:opacity-[0.07] transition-all duration-700 pointer-events-none">
                 <Shield className="w-40 h-40 text-blue-900" />
              </div>

              <div className="flex items-start justify-between mb-10 relative z-10">
                <div className="h-16 w-16 rounded-[1.4rem] bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 border-2 border-indigo-100/50 group-hover:border-blue-500 shadow-sm">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setModalRol({ isOpen: true, rol })}
                    className="h-11 w-11 rounded-2xl bg-slate-50 hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEliminarRol(rol)}
                    className="h-11 w-11 rounded-2xl bg-slate-50 hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3 relative z-10">
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className="h-6 px-3 bg-white border-2 border-slate-100 text-slate-400 font-semibold text-xs rounded-lg">
                      ID: {rol.id}
                    </Badge>
                    <div className="h-px flex-1 bg-slate-50 group-hover:bg-blue-100 transition-colors" />
                </div>
                <h3 className="font-bold text-slate-900 text-2xl group-hover:text-blue-600 transition-colors leading-tight">
                  {rol.nombre}
                </h3>
                <div className="flex items-center gap-2.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <span className="text-xs font-medium text-slate-400">Control de Acceso Total</span>
                </div>
              </div>

              <div className="mt-10 pt-8 border-t-2 border-slate-50 flex items-center justify-between relative z-10">
                <div className="flex flex-col">
                   <p className="text-xs font-medium text-slate-300 leading-none mb-1">Integridad</p>
                   <p className="text-sm font-semibold text-slate-600">Verificado</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                   <MoreVertical className="w-5 h-5 text-slate-300 group-hover:text-blue-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
