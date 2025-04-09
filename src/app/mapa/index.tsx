"use client";

import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import "./styles.css";
import L, { Icon } from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from "react-leaflet";
import { Input } from "../../components/ui/input";
import CidadeRepository from "@/app/repositories/cidade_repository";
import { useAppData } from "@/app/contexts/app_context";
import ClientRepository from "@/app/repositories/cliente_repository";
import { ClienteModel } from "@/app/models/cliente_model";
import { Button } from "../../components/ui/button";
import { FornecedorModel } from "@/app/models/fornecedor_model";
import FornecedorRepository from "@/app/repositories/fornecedor_repository";

interface propsMapa {}



export function Mapa({}: propsMapa) {
  const [carregando, setCarregando] = useState(true);
  const [centro, setCentro] = useState<[number, number]>([0, 0]); // Posição inicial do mapa
  const [cliente, setCliente] = useState<ClienteModel | null>(null);
  const [fornecedores, setFornecedores] = useState<FornecedorModel[]>([]);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const { OrdemCtx } = useAppData();

  const legalIcon = useMemo(
    () =>
      new Icon({
        iconUrl: "https://i.imgur.com/0COHo3Y.png",
        iconSize: [35, 35],
        iconAnchor: [22, 94],
        popupAnchor: [-3, -76],
      }),
    []
  );

  const ClientIcon = useMemo(
    () =>
      new Icon({
        iconUrl: "https://i.imgur.com/ObAibwc.png",
        iconSize: [35, 35],
        iconAnchor: [22, 94],
        popupAnchor: [-3, -76],
      }),
    []
  );

  useEffect(() => {
    async function fetchData() {
      try {
        await carregaLatitudelongitude();
        await carregaFornecedores();
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setCarregando(false);
      }
    }
    fetchData();
  }, []);

  async function carregaFornecedores() {
    const repository = new FornecedorRepository();
    const listaFornecedores = await repository.getAllFornecedores();
    setFornecedores(listaFornecedores);
  }

  async function carregaLatitudelongitude() {
    if (!isNaN(OrdemCtx.ORD_CLI)) {
      const repository = new ClientRepository();
      const cidadeRepository = new CidadeRepository();
      const clienteAux: ClienteModel = await repository.getClienteById(OrdemCtx.ORD_CLI);
      setCliente(clienteAux);

      if (clienteAux.LATITUDE == null || clienteAux.LONGITUDE == null) {
        const latLog: [number, number] = await cidadeRepository.getLatitudeLongitude({
          endereco: clienteAux.ENDERECO ?? "",
          bairro: clienteAux.BAIRRO ?? "",
          cidadeEstado: clienteAux.CIDADE ?? "",
        });
        repository.addLatLong({ ...clienteAux, LATITUDE: String(latLog[0]), LONGITUDE: String(latLog[1]) });
        setCentro(latLog);
        setLatitude(String(latLog[0]));
        setLongitude(String(latLog[1]));
      } else {
        setCentro([Number(clienteAux.LATITUDE), Number(clienteAux.LONGITUDE)]);
        setLatitude(clienteAux.LATITUDE);
        setLongitude(clienteAux.LONGITUDE);
      }
    }
  }

  function calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Raio da Terra em quilômetros
    const rad = Math.PI / 180;

    const dLat = (lat2 - lat1) * rad;
    const dLon = (lon2 - lon1) * rad;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distância em quilômetros
  }

  function atualizaLocalizacao() {
    setCarregando(true);
    const repository = new ClientRepository();
    if (cliente?.CODIGO !== undefined) {
      repository.addLatLong({ ...cliente, LATITUDE: latitude, LONGITUDE: longitude });
    } else {
      console.error("Cliente CODIGO is undefined. Cannot update cliente.");
    }
    setCentro([Number(latitude), Number(longitude)]);
    setCarregando(false);
  }

  function MarcacaoCliente() {
    const [draggable, setDraggable] = useState(false)
    const [position, setPosition] = useState(centro)
    const markerRef = useRef<L.Marker>(null)

    const eventHandlers = useMemo(
      () => ({
        dragend() {
          const marker = markerRef.current
          if (marker != null) {
            setPosition([marker.getLatLng().lat, marker.getLatLng().lng])
          }
        },
      }),
      [],
    )
    const toggleDraggable = useCallback(() => {
      setDraggable((d) => !d)
    }, [])
  
    return (
      <div>
        {carregando? <>carregando</> :  <Marker
        icon={ClientIcon}
        eventHandlers={eventHandlers}
        position={position}
        ref={markerRef}>
        <Popup minWidth={90}>
          <span onClick={toggleDraggable}>
            {cliente?.NOME??''} <br/>
          </span>
        </Popup>
      </Marker>}
     
      </div>
    )
  }

  return (
    <div className="overflow-scroll">
      <div className="p-4 sm:w-[800px] sm:h-auto">
        <div className="border rounded-md p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
            <Input
              type="text"
              value={latitude}
              className="uppercase"
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="latitude"
            />
            <Input
              type="text"
              value={longitude}
              className="uppercase"
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="longitude"
            />
            <Button onClick={atualizaLocalizacao}>Atualizar</Button>
          </div>
          <div>
            {carregando ? (
              <>Carregando...</>
            ) : (
              <MapContainer center={centro} zoom={13} scrollWheelZoom={true} className="map-container">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MarcacaoCliente />
                {fornecedores.map(
                  (fornecedor) =>
                    fornecedor.LATITUDE &&
                    fornecedor.LONGITUDE && (
                      <Marker
                        key={fornecedor.CODIGO}
                        position={[Number(fornecedor.LATITUDE), Number(fornecedor.LONGITUDE)]}
                        icon={legalIcon}
                      >
                        <Popup>
                          {fornecedor.NOME} <br />
                          Fica a{" "}
                          {calcularDistancia(
                            Number(cliente?.LATITUDE),
                            Number(cliente?.LONGITUDE),
                            Number(fornecedor.LATITUDE),
                            Number(fornecedor.LONGITUDE)
                          ).toFixed(2)}{" "}
                          km de distância
                        </Popup>
                      </Marker>
                    )
                )}
              </MapContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
