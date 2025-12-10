import { View, Text, Image } from 'react-native'
import React from 'react'

interface ServicesCardProps {
    name: string
    image: string
}

export default function ServicesCard({ data }: { data: ServicesCardProps[] }) {
    return (
        <View>
            <Text>{JSON.stringify(data)}</Text>
            {/* {data.map((service) => (
                <View key={service.name}>
                    <Text>{service.name}</Text>
                    <Image source={{ uri: service.image }} />
                </View>
            ))} */}
        </View>
    )
}