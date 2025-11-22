import React, {useEffect, useState} from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './Style.css';
import {BlockStack, InlineStack, LegacyCard, Text} from "@shopify/polaris";
import DateRangePicker from "../../components/DateRangePicker";
import {API} from "../../api";
import {SOURCES} from "../../constants";

const Activity = () => {

    const [allChecked, setAllChecked] = useState(false);
    const [loading, setLoading] = useState(true);
    const today = new Date(new Date().setHours(0, 0, 0, 0));
    const [selectedDate, setSelectedDate] = useState({
        title: "Last 14 days",
        alias: "last14days",
        period: {
            since: new Date(
                new Date(new Date().setDate(today.getDate() - 14)).setHours(0, 0, 0, 0)
            ),
            until: new Date(
                new Date(new Date().setDate(today.getDate())).setHours(0, 0, 0, 0)
            ),
        }
    },);
    const [data, setData] = useState();

    useEffect(() => {
        getChartData();
    }, [selectedDate])

    const getChartData = async () => {
        try {
            setLoading(true);
            let startDate = selectedDate?.period?.since?.toDateString();
            let endDate = selectedDate?.period?.until?.toDateString();
            const response = await API.get(`/app/dashboard/activities?startDate=${startDate}&endDate=${endDate}`);
            setData(response.data)
        } catch (e) {
            console.error('Failed to fetch plans', e);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = (event) => {
        setAllChecked(event.target.checked);
    }
    return (
        <BlockStack gap='200'>
            <InlineStack gap="300" blockAlign="center" align="space-between">
                <DateRangePicker selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
                <InlineStack gap="200" blockAlign="center" align="end">
                    <Text as={"p"}>
                        Total Invites
                    </Text>
                    <label className="switch micro chart-filter">
                        <input type="checkbox" tabIndex="0" value={allChecked}
                               onChange={(event) => handleStatusChange(event)}/>
                        <span className="slider round"/>
                        <span>All</span>
                    </label>
                </InlineStack>
            </InlineStack>
            <LegacyCard sectioned>
                <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={data}
                        margin={{
                            top: 20,
                            right: 10,
                            left: 0,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3"/>
                        <XAxis dataKey="name" strokeWidth={0}/>
                        <YAxis strokeWidth={0} label={{
                            value: `Number of invites`,
                            style: { textAnchor: 'middle' },
                            angle: -90,
                            position: 'left',
                            offset: -12,
                        }}/>
                        <Tooltip/>
                        <Legend style={{ bottom: '-10px' }}/>
                        {allChecked ?
                            <Line type="monotone" dataKey="all" stroke="#13acf0" activeDot={{ r: 5 }} strokeWidth={2}
                                  name="Total Invites"/>
                            : <>
                                <Line type="monotone" dataKey={SOURCES.ADMIN} stroke="#13acf0" activeDot={{ r: 5 }}
                                      strokeWidth={2} name="Admin Invites"/>
                                <Line type="monotone" dataKey={SOURCES.FRONTEND} stroke="#6a42e9" activeDot={{ r: 5 }}
                                      strokeWidth={2} name="Storefront Invites"/>
                                <Line type="monotone" dataKey={SOURCES.FLOW} stroke="#006ca5" activeDot={{ r: 5 }}
                                      strokeWidth={2} name="Flow Invites"/>
                            </>}

                    </LineChart>
                </ResponsiveContainer>
            </div>
            </LegacyCard>
        </BlockStack>
    );
}

export default Activity;
