import pandas as pd
import json

import matplotlib.pyplot as plt
plt.style.use('ggplot')

data = pd.read_json('/home/eroland/db.json')

d = {'sensor1accX': pd.Series(),
     'sensor1accY': pd.Series(),
     'sensor1accZ': pd.Series(),
     'sensor1gyroX': pd.Series(),
     'sensor1gyroY': pd.Series(),
     'sensor1gyroZ': pd.Series()}

for index, row in data.iterrows():
    lecture = json.loads(row[0])
    if(lecture['ID'] == 'Sensor1'):
        d['sensor1accX'] = d['sensor1accX'].append(pd.Series([lecture['accX']], index=[lecture['cont']]))
        d['sensor1accY'] = d['sensor1accY'].append(pd.Series([lecture['accY']], index=[lecture['cont']]))
        d['sensor1accZ'] = d['sensor1accZ'].append(pd.Series([lecture['accZ']], index=[lecture['cont']]))
        d['sensor1gyroX'] = d['sensor1gyroX'].append(pd.Series([lecture['gyroX']], index=[lecture['cont']]))
        d['sensor1gyroY'] = d['sensor1gyroY'].append(pd.Series([lecture['gyroY']], index=[lecture['cont']]))
        d['sensor1gyroZ'] = d['sensor1gyroZ'].append(pd.Series([lecture['gyroZ']], index=[lecture['cont']]))

df = pd.DataFrame(d)
d['sensor1accX'].plot()
